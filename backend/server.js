const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const { Pool } = require('pg');
// const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const promBundle = require('express-prom-bundle');
const { auth } = require("express-oauth2-jwt-bearer");
const https = require("node:https");

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || "MOJ_TAJNY_KLUCZ_123";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://wordle_user:wordlepass@localhost:5432/wordle_db";
const MQTT_URL = process.env.MQTT_URL || "mqtt://broker.hivemq.com";

const fallbackWords = [
    "LAMPA",
    "KARTA",
    "MORZE",
    "ROWEK",
    "KWIAT",
    "MYSZA",
    "RYBAK",
    "ZAMEK",
    "OBRAZ",
    "DYWAN",
    "KLUCZ",
    "SKAŁA",
    "RZEKA",
    "WYSPA",
    "BURZA",
    "WIATR",
    "CHATA",
    "PAŁAC",
    "ULICA",
    "SKLEP",
    "TEATR",
    "OPERA",
    "BAJKA",
    "SERCE",
    "MLEKO",
    "MASŁO",
    "CHLEB",
    "KASZA",
    "ŚLIWA",
    "BANAN",
    "MANGO",
    "KAKAO",
    "KOTEK",
    "PIESE",
    "SARNA",
    "MOTYL",
    "PANDA",
    "ZEBRA",
    "ORZEŁ",
    "SOWAA",
    "PIŁKA",
    "OGIEŃ",
    "LUTYY",
    "DUMNY",
    "CICHY",
    "WOLNY",
    "RADOS",
    "SMUTE",
    "BIAŁY",
    "CZARN",
    "SZARY",
    "ZŁOTY",
    "KOLOR",
    "GITAR",
    "FORTE",
    "PIANO",
    "NOŻYK",
    "GARNE",
    "ŁYŻKA",
    "MISKA",
    "WAZON",
    "FOTEL",
    "KANAP",
    "PÓŁKA",
    "ZEGAR",
    "RADIO",
    "EKRAN",
    "MYSZK",
    "KABEL",
    "DROGA",
    "MOSTY",
    "TUNEL",
    "PARKI",
    "LASER",
    "PLAŻA",
    "WODOS",
    "CHMUR",
    "TĘCZA",
    "MROZY",
    "UPAŁY",
    "GÓRAL",
    "MNICH",
    "KRÓLJ",
    "KSIĄŻ",
    "WÓZEK",
    "POCIĄ",
    "STATE",
    "ŻAGEL",
    "KURKA",
    "JELEN",
    "BÓBRY",
    "KRETA",
    "LILIA",
    "RÓŻAA",
    "TULIP",
    "IRYSS",
    "BRZEG",
    "GLEBA",
    "ZIARN",
    "PLONY"
];

const fs = require("fs");
const path = require("path");
function loadWords() {
    const filePath = path.join(__dirname, "pl_full.txt");
    const words = fs
        .readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .map(line => line.trim().split(/\s+/)[0])
        .filter(Boolean)
        .map(word => word.toUpperCase())
        .filter(word =>
            word.length === 5 &&
            /^[A-ZĄĆĘŁŃÓŚŹŻ]+$/.test(word)
        );
    console.log(`Załadowano ${words.length} słów 5-literowych`);
    return words;
}

const wordsList = loadWords();
function getRandomLocalWord() {
    const index = Math.floor(Math.random() * wordsList.length);
    return wordsList[index];
}

app.use(express.json());
app.use(cors());

// Backend zabezpieczony OAuth 2.0
const checkJwt = auth({
    audience: "https://wordle-api",
    issuerBaseURL: "https://dev-5ln5q8rhsoy0fkmx.us.auth0.com/", // czy token z auth0?
});

const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    promClient: { collectDefaultMetrics: {} }
});
app.use(metricsMiddleware);

function requireAdmin(req, res, next) {
    const roles = req.auth?.payload?.["https://wordle-api/roles"] || [];
    if (!roles.includes("admin")) {
        return res.status(403).json({
            error: "Brak uprawnień administratora"
        });
    }
    next();
}


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const db = new Pool({
    connectionString: DATABASE_URL,
});

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
    // const url = `https://random-word-api.herokuapp.com/word?length=5`;
    try {
        const word = getRandomLocalWord();

        roomSessions[roomName] = {
            word,
            lastUpdated: new Date()
        };
        mqttClient.publish(
            `wordle/game/${roomName}/new-round`,
            `Nowe słowo wylosowane dla pokoju: ${roomName}`
        );

        console.log(`Pokój [${roomName}] otrzymał słowo: ${word}`);
        return word;

    } catch (e) {
      roomSessions[roomName] = { word: "KOTKI", lastUpdated: new Date() };
      return "KOTKI";
    }
}
const rooms = ['Globalny', 'Pokój 1', 'Pokój 2', 'Eksperci'];

app.post('/api/new-game', checkJwt, async (req, res) => {
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

// app.put('/api/user/reset', checkJwt, async (req, res) => {
//   try {
//         await db.query("UPDATE users SET score = 0 WHERE id = $1", [req.auth]);
//         res.json({ message: "Statystyki zostały zresetowane!" });
//     } catch (err) {
//         res.status(500).json({ error: "Błąd bazy danych" });
//     }
// });

app.delete('/api/user', checkJwt, async (req, res) => {
  try {
        const email = req.auth.payload.email;
        await db.query("DELETE FROM users WHERE username  = $1", [email]);
        res.json({ message: "Twoje konto zostało trwale usunięte." });
    } catch (err) {
        res.status(500).json({ error: "Błąd bazy danych" });
    }
});

// endpoint uwzględniający role użytkownika
app.delete('/api/admin/users/:id', checkJwt, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM users WHERE id = $1", [id]);
        res.json({ message: "Użytkownik został usunięty." });
    } catch (err) {
        res.status(500).json({ error: "Błąd bazy danych" });
    }
});

//logika gry
app.post('/api/play', checkJwt, async (req, res) => {
  const { guess, room } = req.body;

    if (!rooms.includes(room)) {
        return res.status(400).json({ error: "Nieprawidłowy pokój" });
    }

  if (!roomSessions[room]) {
    // return res.status(400).json({ error: "Nieprawidłowy pokój" });
    await generateWordForRoom(room);
    console.log("SESSION:", roomSessions[room]);
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
app.get('/api/stats', checkJwt, async (req, res) => {
  try {
        const result = await db.query("SELECT id, username, score FROM users ORDER BY score DESC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Błąd bazy danych" });
    }
});

// endpoint uwzględniający role użytkownika
app.put('/api/admin/stats/reset', checkJwt, requireAdmin, async (req, res) => {
    try {
        await db.query("UPDATE users SET score = 0");
        res.json({ message: "Statystyki wszystkich użytkowników zostały zresetowane." });
    } catch (err) {
        res.status(500).json({ error: "Błąd bazy danych" });
    }
});

// Wyszukiwanie wzorca
app.get('/api/search/:pattern', checkJwt, async (req, res) => {
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
          await db.query(
              `INSERT INTO users (username, password, score)
             VALUES ($1, '', 0)
             ON CONFLICT (username) DO NOTHING`,
              [data.user]
          );

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