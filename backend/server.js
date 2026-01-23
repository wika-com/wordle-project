const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const db = new sqlite3.Database(':memory:'); // Wersja testowa w pamięci RAM

//BAZA DANYCH
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, score INTEGER)");
  db.run("INSERT INTO users (username, score) VALUES ('Admin', 100)");
});

//HTTP REST API
app.get('/api/stats', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => res.json(rows));
});

app.post('/api/register', (req, res) => {
  const { username } = req.body;
  db.run("INSERT INTO users (username, score) VALUES (?, 0)", [username], function(err) {
    res.status(201).json({ id: this.lastID });
  });
});

// Wyszukiwanie wzorca
app.get('/api/search/:pattern', (req, res) => {
  const pattern = `%${req.params.pattern}%`;
  db.all("SELECT * FROM users WHERE username LIKE ?", [pattern], (err, rows) => res.json(rows));
});

//MQTT
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com'); // Publiczny broker do testów
mqttClient.on('connect', () => {
  console.log('Połączono z MQTT');
  mqttClient.subscribe('wordle/game/win');
});

//WEBSOCKET
io.on('connection', (socket) => {
  console.log('Nowy gracz połączony:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Gracz dołączył do pokoju: ${room}`);
  });

  socket.on('send_guess', (data) => {
    // Logika sprawdzania słowa
    const result = data.guess === "PIESEK" ? "WIN" : "TRY_AGAIN";
  
    if(result === "WIN") {
      mqttClient.publish('wordle/game/win', `Gracz ${data.user} odgadł hasło!`);
    }
    
    io.to(data.room).emit('receive_result', { user: data.user, result });
  });
});

server.listen(3000, () => console.log('Serwer działa na porcie 3000'));