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

// Baza danych
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      username TEXT UNIQUE, 
      password TEXT, 
      score INTEGER DEFAULT 0
  )`);
});

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
      res.json({ token, username: user.username });
    } else {
      res.status(401).json({ error: "Błędne dane" });
    }
  });
});

//logika gry
app.post('/api/play', (req, res) => {
  const { guess } = req.body;
  const target = "KOTKI"; // losowe słowo poprawic
  const feedback = [];

  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) feedback.push('green');
    else if (target.includes(guess[i])) feedback.push('yellow');
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

// WEBSOCKET
io.on('connection', (socket) => {
  console.log('Nowy gracz połączony:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Gracz dołączył do pokoju: ${room}`);
  });

  socket.on('send_guess', (data) => {
    //Logika sprawdzania słowa 
    const result = data.guess === "PIESEK" ? "WIN" : "TRY_AGAIN";
    if(result === "WIN") {
      mqttClient.publish('wordle/game/win', `Gracz ${data.user} odgadł hasło!`);
      db.run("UPDATE users SET score = score + 1 WHERE username = ?", [data.user]);
    }
    io.to(data.room).emit('receive_result', { user: data.user, result:data.result });
  });
});

server.listen(3000, () => console.log('Serwer działa na porcie 3000'));