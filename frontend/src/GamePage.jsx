import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from "socket.io-client";
import { AppContext } from "../context/AppContext";
const socket = io("http://localhost:3000");

export default function GamePage() {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [guess, setGuess] = useState('');
  const [board, setBoard] = useState([]); // Historia prób
  const [message, setMessage] = useState('');

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
      const res = await axios.delete("http://localhost:3000/api/user/reset", {}, {
        headers: { Authorization: token}
      });
      alert(res.data.message);
      localStorage.removeItem('token');
      window.location.href = "/login";
    } catch (err) {
      alert("Błąd w usuwaniu konta...");
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
      setBoard([...board, { word: guess.toUpperCase(), feedback: newFeedback }]);
      setGuess('');
    } catch (err) {
      setMessage("Sesja wygasła. Zaloguj się ponownie.");
    }
  };
return (
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
          <div className='input'>
            <input 
                maxLength={5} 
                value={guess} 
                onChange={e => setGuess(e.target.value.toUpperCase())} 
                onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
            />
            <button onClick={submitGuess}>Sprawdź</button>
          </div>
          <div className='status'>
            <button onClick={() => { localStorage.removeItem('token'); setToken(null); }}>Wyloguj</button>
            <div className="account-settings">
                <button onClick={handleReset} id="reset" >Resetuj statystyki</button>
                <button onClick={handleDeleteAccount} id="delete">Usuń konto</button>
            </div>
          </div>
    </div>
    );
}