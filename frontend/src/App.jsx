import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import './App.css';
const socket = io("http://localhost:3000");

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [guess, setGuess] = useState('');
  const [board, setBoard] = useState([]); // Historia prób
  const [message, setMessage] = useState('');

  const handleRegister = async () => {
    try {
      await axios.post('http://localhost:3000/api/register', { username, password });
      alert("Zarejestrowano!");
    } catch (err) {
      alert(err.response.data.error);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/login', { username, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      setMessage("Zalogowano pomyślnie!");
    } catch (err) {
      alert("Błąd logowania");
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Czy na pewno chcesz zresetować swój wynik?")) return;
    try {
      const res = await axios.put("http://localhost:3000/api/user/reset", {}, {
        headers: { Authorization: token}
      });
      alert(res.data.message);
    } catch (err) {
      alert("Błąd w resetowaniu...");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Czy napewno chcesz usunąć konto?")) return;
    try {
      const res = await axios.put("http://localhost:3000/api/user/reset", {}, {
        headers: { Authorization: token}
      });
      alert(res.data.message);
    } catch (err) {
      alert("Błąd w resetowaniu...");
    }
  }
  // Wysyłanie słowa do gry
  const submitGuess = async () => {
    if (guess.length !== 5) return alert("Słowo musi mieć 5 liter!");
    try {
      const res = await axios.post('http://localhost:3000/api/play', 
        { guess: guess.toUpperCase() },
        { headers: { Authorization: token } }
      );

      const newFeedback = res.data.feedback;
      // Powiadom inne osoby w pokoju o swoim ruchu przez Socket.io
      socket.emit('send_guess', {
          room: 'global_room', //zamienić na zmienną z inputa
          user: username,
          guess: guess.toUpperCase(),
          result: newFeedback
      });
      setBoard([...board, { word: guess.toUpperCase(), feedback: res.data.feedback }]);
      setGuess('');
    } catch (err) {
      setMessage("Sesja wygasła. Zaloguj się ponownie.");
    }
  };

  return (
    <div className="App">
      <h1>Wordle Pro Project</h1>

      {!token ? (
        <div className="auth-container">
          <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <button onClick={handleRegister}>Register</button>
          <button onClick={handleLogin}>Login</button>
        </div>
      ) : (
        <div className="game-container">
          <p>Witaj, {username}!</p>
          
          <div className="grid">
            {board.map((attempt, i) => (
              <div key={i} className="row">
                {attempt.word.split('').map((char, j) => (
                  <span key={j} className={`tile ${attempt.feedback[j]}`}>
                    {char}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <input 
            maxLength={5} 
            value={guess} 
            onChange={e => setGuess(e.target.value.toUpperCase())} 
          />
          <button onClick={submitGuess}>Sprawdź</button>
          <button onClick={() => { localStorage.removeItem('token'); setToken(null); }}>Wyloguj</button>
          <div className="account-settings">
            <button onClick={handleReset} style={{ backgroundColor: 'orange' }}>Resetuj statystyki</button>
            <button onClick={handleDeleteAccount} style={{ backgroundColor: 'red' }}>Usuń konto</button>
          </div>
        </div>
      )}
      <p>{message}</p>
    </div>
  );
}

export default App;