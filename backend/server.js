const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET_KEY = "TWOJ_TAJNY_KLUCZ_123";
app.use(express.json());
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const db = new sqlite3.Database('./wordle.db');
const userSessions = {};

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "Brak tokena" });
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Sesja wygasła" });
        req.userId = decoded.id;
        next();
    });
}

// Baza danych
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      username TEXT UNIQUE, 
      password TEXT, 
      score INTEGER DEFAULT 0
  )`);
});

// async function updateTargetWord() {
//     const url = `https://random-word-api.herokuapp.com/word?length=5`;
//     try {
//         const response = await fetch(url);
//         if (response.ok) {
//             const words = await response.json();
//             targetWord = words[0].toUpperCase();
//             console.log(`Nowe słowo dnia: ${targetWord}`);
//         }
//     } catch (e) {
//         console.error("Nie udało się pobrać słowa, zostaję przy domyślnym.");
//     }
// }
// updateTargetWord();

async function generateNewWord(userId) {
  const url = `https://random-word-api.herokuapp.com/word?length=5`;
  try {
    const response = await fetch(url);
    if (response.ok) {
        const words = await response.json();
        const word = words[0].toUpperCase();
        
        // Zapisujemy słowo tylko dla tego konkretnego użytkownika
        userSessions[userId] = {
            word: word,
            startTime: new Date()
        };
        console.log(`Użytkownik ${userId} otrzymał słowo: ${word}`);
        return word;
    }
  } catch (e) {
      // Fallback w razie błędu API
      userSessions[userId] = { word: "KOTKI" };
      return "KOTKI";
  }
}
app.post('/api/new-game', verifyToken, async (req, res) => {
  try{
    console.log("Generowanie nowej gry dla ID:", req.userId);
    const word = await generateNewWord(req.userId);
    res.json({ message: "Nowe słowo wylosowane!", status:"ready" });
  } catch (err) {
    console.error("Błąd generowania słowa:", error);
    res.status(500).json({ error: "Błąd serwera przy losowaniu słowa" });
  }  
});

// app.post('/api/new-game', verifyToken, async (req, res) => {
//     const word = await generateNewWord(req.userId);
//     res.json({ message: "Nowe słowo wylosowane!", status: "ready" });
// });

app.post('/api/register', async (req, res) => {
  try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
        if (err) return res.status(400).json({ error: "Użytkownik istnieje!" });
        res.status(201).json({ id: this.lastID });
      });
  } catch (e) {
    res.status(500).json({ error: "Błąd serwera" })
  }
});

//logowaniee
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
      res.json({ token, username: user.username, userId:user.id });
    } else {
      res.status(401).json({ error: "Błędne dane" });
    }
  });
});

// app.post('/api/new-game', verifyToken, (req, res) => {
//     const userId = req.userId; // ID z tokena
//     const words = ["KOTKI", "RYBKA", "DOMKI", "KWIAT"];
//     const newWord = words[Math.floor(Math.random() * words.length)];
    
//     userSessions[userId] = {
//         word: newWord,
//         attempts: 0
//     };
//     res.json({ message: "Nowe słowo wylosowane!" });
// });

// Resetowanie statystyk (update)
app.put('/api/user/reset', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "Brak tokena" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Sesja wygasła" });

        db.run("UPDATE users SET score = 0 WHERE id = ?", [decoded.id], function(err) {
            if (err) return res.status(500).json({ error: "Błąd bazy danych" });
            res.json({ message: "Statystyki zostały zresetowane!" });
        });
    });
});

// Usuwanie konta
app.delete('/api/user', (req, res) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "Brak tokena" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Sesja wygasła" });

        db.run("DELETE FROM users WHERE id = ?", [decoded.id], function(err) {
            if (err) return res.status(500).json({ error: "Błąd bazy danych" });
            res.json({ message: "Twoje konto zostało trwale usunięte." });
        });
    });
});

//logika gry
app.post('/api/play', verifyToken, (req, res) => {
  const { guess } = req.body;
  const userId = req.userId;
  const feedback = [];
  if (!userSessions[userId]) {
    return res.status(400).json({ error: "Najpierw zacznij nową grę!" });
  }
  if (!guess || guess.length !== 5) {
        return res.status(400).json({ error: "Słowo musi mieć 5 liter" });
  }
  const upperGuess = guess.toUpperCase();
  const userWord = userSessions[req.userId].word;
  for (let i = 0; i < 5; i++) {
    if (upperGuess[i] === userWord[i]) feedback.push('green');
    else if (userWord.includes(upperGuess[i])) feedback.push('yellow');
    else feedback.push('grey');
  }
  res.json({ feedback });
});

//statystyki
app.get('/api/stats', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => res.json(rows));
});

// Wyszukiwanie wzorca
app.get('/api/search/:pattern', (req, res) => {
  const pattern = `%${req.params.pattern}%`;
  db.all("SELECT * FROM users WHERE username LIKE ?", [pattern], (err, rows) => res.json(rows));
});

// MQTT
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com'); // Publiczny broker do testów
mqttClient.on('connect', () => {
  console.log('Połączono z MQTT');
  mqttClient.subscribe('wordle/game/win');
});

const rooms = ['Globalny', 'Pokój 1', 'Pokój 2', 'Eksperci'];
// WEBSOCKET
io.on('connection', (socket) => {
  console.log('Nowy gracz połączony:', socket.id);

  socket.on('join_room', (data) => {
    const room = typeof data === 'string' ? data : data.room;
    const user = data.user || "Anonim";
    // socket.rooms.forEach((room) => {
    //   if (room !== socket.id) socket.leave(room);
    // });

    for (const r of socket.rooms) {
      if (r !== socket.id) socket.leave(r);
    }
    socket.join(room);
    console.log(`Gracz dołączył do pokoju: ${room}`);

    socket.to(room).emit('notification', {
      message: `Użytkownik ${user} dołączył do gry!`
    });
    
  });

  socket.on('send_message', (data) => {
    const { room, user, message } = data;
    const timestamp = new Date().toLocaleTimeString();

    // wiadomość do wszystkich w pokoju, włącznie z nadawcą
    io.to(room).emit('receive_message', {
      room,
      user,
      message,
      timestamp
    });
    // Publikacja na MQTT dla logów
      mqttClient.publish(`wordle/chat/${room}`, `${user}: ${message}`);
  });

  //Logika sprawdzania słowa 
  socket.on('send_guess', (data) => {
    const userId = data.userId;
    const session = userSessions[userId];
    if (!session) return;
    const isWin = data.guess.toUpperCase() === session.word;
    if(isWin) {
      mqttClient.publish('wordle/game/win', `Gracz ${data.user} odgadł hasło!`);
      db.run("UPDATE users SET score = score + 1 WHERE username = ?", [data.user]);
    }
    io.to(data.room).emit('receive_result', { user: data.user, result: data.result, isWin: isWin });
  });
});

server.listen(3000, () => console.log('Serwer działa na porcie 3000'));