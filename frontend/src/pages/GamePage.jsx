import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';
import socket from "../socket"; // Upewnij się, że masz ten plik konfiguracyjny socketu

export default function GamePage() {
    // Pobieramy dane zalogowanego użytkownika z kontekstu
    const { userName, token, logout } = useContext(AppContext);
    
    // Stany gry z Twojego pierwotnego App.jsx
    const [guess, setGuess] = useState('');
    const [board, setBoard] = useState([]); // Historia prób
    const [message, setMessage] = useState('');
    const [gameOver, setGameOver] = useState(false);

    // Inicjalizacja połączenia socket
    useEffect(() => {
        socket.emit('join_room', 'global_room');
        
        // Czyścimy nasłuchiwanie przy wyjściu z komponentu
        return () => {
            socket.off('receive_result');
        };
    }, []);

    // Funkcja nowej gry
    const startNewGame = () => {
        setBoard([]);
        setGuess('');
        setGameOver(false);
        setMessage('');
    };

    // Resetowanie statystyk (z Twojego App.jsx)
    const handleReset = async () => {
        if (!window.confirm("Czy na pewno chcesz zresetować swój wynik?")) return;
        try {
            const res = await axios.put("http://localhost:3000/api/user/reset", {}, {
                headers: { Authorization: token }
            });
            alert(res.data.message);
        } catch (err) {
            alert("Błąd w resetowaniu...");
        }
    };

    // Usuwanie konta (z Twojego App.jsx)
    const handleDeleteAccount = async () => {
        if (!window.confirm("Czy napewno chcesz usunąć konto?")) return;
        try {
            const res = await axios.delete("http://localhost:3000/api/user", {
                headers: { Authorization: token }
            });
            alert(res.data.message);
            logout(); // Wylogowanie po usunięciu konta
        } catch (err) {
            alert("Błąd w usuwaniu konta...");
        }
    };

    // Logika wysyłania słowa (z Twojego App.jsx)
    const submitGuess = async () => {
        if (gameOver) return;
        if (guess.length !== 5) return alert("Słowo musi mieć 5 liter!");
        
        try {
            const res = await axios.post('http://localhost:3000/api/play', 
                { guess: guess.toUpperCase() },
                { headers: { Authorization: token } }
            );

            const newFeedback = res.data.feedback;
            const isCorrect = newFeedback.every(status => status === 'green');
            const newBoard = [...board, { word: guess.toUpperCase(), feedback: newFeedback }];

            setBoard(newBoard);
            setGuess('');

            // Socket.io - powiadomienie innych
            socket.emit('send_guess', {
                room: 'global_room',
                user: userName,
                guess: guess.toUpperCase(),
                result: newFeedback
            });

            if (isCorrect) {
                setGameOver(true);
                setMessage("BRAWO! Odgadłeś słowo!");
            } else if (newBoard.length >= 6) {
                setGameOver(true);
                setMessage("KONIEC GRY. Nie udało się odgadnąć słowa.");
            }
        } catch (err) {
            setMessage("Sesja wygasła lub błąd serwera.");
        }
    };

    return (
        <div className="game-container">
            <p className="welcome-msg">Witaj, <strong>{userName}</strong>!</p>
            
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
                {/* Puste rzędy dla lepszego efektu wizualnego (opcjonalnie) */}
                {[...Array(Math.max(0, 6 - board.length))].map((_, i) => (
                    <div key={`empty-${i}`} className="row empty">
                        {[...Array(5)].map((_, j) => <span key={j} className="tile"></span>)}
                    </div>
                ))}
            </div>

            <div className="game-controls">
                <input 
                    maxLength={5} 
                    value={guess} 
                    onChange={e => setGuess(e.target.value.toUpperCase())} 
                    disabled={gameOver}
                    onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
                    placeholder="WPISZ SŁOWO"
                />
                <button className="btn-submit" onClick={submitGuess} disabled={gameOver}>Sprawdź</button>
                {gameOver && <button className="btn-newgame" onClick={startNewGame}>Nowa Gra</button>}
            </div>

            {message && <p className="game-message">{message}</p>}

            <div className="account-settings">
                <button onClick={handleReset} style={{ backgroundColor: 'orange' }}>Resetuj statystyki</button>
                <button onClick={handleDeleteAccount} style={{ backgroundColor: 'red' }}>Usuń konto</button>
            </div>
        </div>
    );
}