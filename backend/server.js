const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const { Pool } = require('pg');
// const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const promBundle = require('express-prom-bundle');

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || "MOJ_TAJNY_KLUCZ_123";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://wordle_user:wordlepass@localhost:5432/wordle_db";
const MQTT_URL = process.env.MQTT_URL || "mqtt://broker.hivemq.com";

app.use(express.json());
app.use(cors());

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    promClient: { collectDefaultMetrics: {} }
});
app.use(metricsMiddleware);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const db = new Pool({
    connectionString: DATABASE_URL,
});
// const db = new sqlite3.Database('./wordle.db');
// const userSessions = {};

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
const initDb = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY, 
                username TEXT UNIQUE, 
                password TEXT, 
                score INTEGER DEFAULT 0
            )
        `);
        console.log("Połączono z PostgreSQL i zainicjalizowano tabelę.");
    } catch (err) {
        console.error("Błąd inicjalizacji bazy danych:", err);
    }
};
initDb();

// livenessProbe: sprawdza, czy aplikacja żyje
app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date() });
});

// readinessProbe: sprawdza, czy czy baza działa
app.get('/ready', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.status(200).json({ status: "READY" });
    } catch (err) {
        res.status(500).json({ status: "NOT_READY", error: err.message });
    }
});

const roomSessions = {};
async function generateWordForRoom(roomName) {
    const url = `https://random-word-api.herokuapp.com/word?length=5`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        const words = await response.json();
        const word = words[0].toUpperCase();
        roomSessions[roomName] = {
          word: word,
          lastUpdated: new Date()
        };
        mqttClient.publish(`wordle/game/${roomName}/new-round`, `Nowe słowo wylosowane dla pokoju: ${roomName}`);
        console.log(`Pokój [${roomName}] otrzymał słowo: ${word}`);
        return word;
      }
    } catch (e) {
      roomSessions[roomName] = { word: "KOTKI", lastUpdated: new Date() };
      return "KOTKI";
    }
}
const rooms = ['Globalny', 'Pokój 1', 'Pokój 2', 'Eksperci'];

app.post('/api/new-game', verifyToken, async (req, res) => {
  const {room} = req.body;
  if (!rooms.includes(room)) {
      return res.status(400).json({ error: "Nieprawidłowy pokój" });
  }
  try{
    await generateWordForRoom(room);
    res.json({ message: "Nowe słowo wylosowane!", status:"ready" });
  } catch (err) {
    res.status(500).json({ error: "Błąd serwera" });
  }  
});

app.post('/api/register', async (req, res) => {
  try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);
        res.status(201).json({ message: "Zarejestrowano pomyślnie" });
  } catch (e) {
    if (e.code === '23505') { // Kod błędu dla unikalnego wpisu w Postgres (Duplicate key)
          return res.status(400).json({ error: "Użytkownik istnieje!" });
      }
    res.status(500).json({ error: "Błąd serwera" })
  }
});

//logowaniee
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
      res.json({ token, username: user.username, userId: user.id });
    } else {
      res.status(401).json({ error: "Błędne dane" });
    }
  } catch (err) {
    res.status(500).json({ error: "Błąd serwera" });
  }
  // const { username, password } = req.body;
  // db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
  //   if (user && await bcrypt.compare(password, user.password)) {
  //     const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
  //     res.json({ token, username: user.username, userId:user.id });
  //   } else {
  //     res.status(401).json({ error: "Błędne dane" });
  //   }
  // });
});

app.put('/api/user/reset', verifyToken, async (req, res) => {
  try {
        await db.query("UPDATE users SET score = 0 WHERE id = $1", [req.userId]);
        res.json({ message: "Statystyki zostały zresetowane!" });
    } catch (err) {
        res.status(500).json({ error: "Błąd bazy danych" });
    }
    // db.run("UPDATE users SET score = 0 WHERE id = ?", [req.userId], function(err) {
    //     if (err) return res.status(500).json({ error: "Błąd bazy danych" });
    //     res.json({ message: "Statystyki zostały zresetowane!" });
    // });
});

app.delete('/api/user', verifyToken, async (req, res) => {
  try {
        await db.query("DELETE FROM users WHERE id = $1", [req.userId]);
        res.json({ message: "Twoje konto zostało trwale usunięte." });
    } catch (err) {
        res.status(500).json({ error: "Błąd bazy danych" });
    }
    // db.run("DELETE FROM users WHERE id = ?", [req.userId], function(err) {
    //     if (err) return res.status(500).json({ error: "Błąd bazy danych" });
    //     res.json({ message: "Twoje konto zostało trwale usunięte." });
    // });
});

//logika gry
app.post('/api/play', verifyToken, (req, res) => {
  const { guess, room } = req.body;
  if (!roomSessions[room]) {
    return res.status(400).json({ error: "Nieprawidłowy pokój" });
  }
  if (!guess || guess.length !== 5) {
    return res.status(400).json({ error: "Słowo musi mieć 5 liter" });
  }
  const targetWord = roomSessions[room].word;
  const feedback = [];
  const upperGuess = guess.toUpperCase();

  // const userWord = userSessions[req.userId].word;
  for (let i = 0; i < 5; i++) {
    if (upperGuess[i] === targetWord[i]) feedback.push('green');
    else if (targetWord.includes(upperGuess[i])) feedback.push('yellow');
    else feedback.push('grey');
  }
  res.json({ feedback });
});

//statystyki
app.get('/api/stats', async (req, res) => {
  try {
        const result = await db.query("SELECT id, username, score FROM users ORDER BY score DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Błąd bazy danych" });
    }
  // db.all("SELECT * FROM users", [], (err, rows) => res.json(rows));
});

// Wyszukiwanie wzorca
app.get('/api/search/:pattern', async (req, res) => {
  const pattern = `%${req.params.pattern}%`;
  try {
      const result = await db.query("SELECT id, username, score FROM users WHERE username LIKE $1", [pattern]);
      res.json(result.rows);
  } catch (err) {
      res.status(500).json({ error: "Błąd bazy danych" });
  }
  // db.all("SELECT * FROM users WHERE username LIKE ?", [pattern], (err, rows) => res.json(rows));
});

// MQTT
const mqttClient = mqtt.connect(MQTT_URL);
mqttClient.on('connect', () => {
  console.log('Połączono z MQTT');
  mqttClient.subscribe('wordle/game/win');
  rooms.forEach(room => generateWordForRoom(room));
});

// WEBSOCKET
io.on('connection', (socket) => {
  console.log('Nowy gracz połączony:', socket.id);
  socket.on('join_room', (data) => {
    const room = typeof data === 'string' ? data : data.room;
    const user = data.user || "Anonim";

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

    // wiadomość do wszystkich w pokoju
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
  socket.on('send_guess', async (data) => {
    const room = data.room;
    const session = roomSessions[room];
    if (!session) return;
    const isWin = data.guess.toUpperCase() === session.word;
    if(isWin) {
      mqttClient.publish('wordle/game/win', `Gracz ${data.user} odgadł hasło w pokoju ${room}!`);
      // db.run("UPDATE users SET score = score + 1 WHERE username = ?", [data.user]);
      try {
          await db.query("UPDATE users SET score = score + 1 WHERE username = $1", [data.user]);
      } catch (err) {
          console.error("Nie udało się zaktualizować wyniku:", err);
      }
      generateWordForRoom(room);
      io.to(room).emit('game_reset', { winner: data.user, isLocked:true });
    }
    io.to(data.room).emit('receive_result', { user: data.user, result: data.result, isWin: isWin });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));