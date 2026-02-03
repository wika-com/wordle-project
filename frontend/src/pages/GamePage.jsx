import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext.jsx';
import socket from "../socket";
import "./GamePage.css";
import Sidebar from '../components/Sidebar.jsx';
import { toast } from 'react-toastify';

export default function GamePage() {
    const data = useContext(AppContext);
    const [guess, setGuess] = useState('');
    const [board, setBoard] = useState([]);
    const [message, setMessage] = useState('');
    const [gameOver, setGameOver] = useState(false);
    const didInit = useRef(false);

    // połączenia socket
    useEffect(() => {
        if (data.activeRoom && data.userName) {
        socket.emit('join_room', { room: data.activeRoom, user: data.userName });
        }
        //nasłuchiwanie przy wyjściu z komponentu
        socket.on('receive_result', (payload) => {
            if (payload.user !== data.userName) {
                if (payload.isWin) {
                    toast.info(`${payload.user} odgadł słowo!`);
                }
            }
        });
        return () => {
            socket.off('receive_result');
        };
    }, [data.activeRoom, data.userName]);

    useEffect(() => {
        setBoard([]);
        setGuess('');
        setGameOver(false);
        setMessage(`Witaj w pokoju: ${data.activeRoom}!`);
    }, [data.activeRoom]);

    const startNewGame = () => {
        setBoard([]);
        setGuess('');
        setGameOver(false);
        setMessage('Nowa gra rozpoczęta!');
    };

    useEffect(() => {
        if(!data.token) return;
        if (didInit.current) return;
        didInit.current = true;
        startNewGame();
    }, []);

    const handleReset = async () => {
        if (!window.confirm("Czy na pewno chcesz zresetować swój wynik?")) return;
        try {
            const res = await axios.put("http://localhost:3000/api/user/reset", {}, {
                headers: { Authorization: data.token }
            });
            toast.success(res.data.message);
        } catch (err) {
            toast.error("Błąd w resetowaniu...");
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Czy napewno chcesz usunąć konto?")) return;
        try {
            const res = await axios.delete("http://localhost:3000/api/user", {
                headers: { Authorization: data.token }
            });
            toast.success(res.data.message);
            data.logout();
        } catch (err) {
            toast.error("Błąd w usuwaniu konta...");
        }
    };

    const submitGuess = async () => {
        if (gameOver) return;
        if (guess.length !== 5) return toast.error("Słowo musi mieć 5 liter!");
        if (!/^[A-Za-z0-9ąćęłńóśżź]+$/.test(guess)) {
            toast.error("Hasło zawiera niedozwolone znaki: , ! @ % # * + $ ?");
            return;
        }
        
        try {
            const res = await axios.post('http://localhost:3000/api/play', 
                { guess: guess.toUpperCase(),
                    room: data.activeRoom
                },
                { headers: { Authorization: data.token } }
            );

            const newFeedback = res.data.feedback;
            const isCorrect = newFeedback.every(status => status === 'green');
            const newBoard = [...board, { word: guess.toUpperCase(), feedback: newFeedback }];
            const currentRoom = data.activeRoom;

            setBoard(newBoard);
            setGuess('');

            // Socket.io - powiadomienie innych
            socket.emit('send_guess', {
                room: data.activeRoom,
                user: data.userName,
                guess: guess.toUpperCase(),
                result: newFeedback,
                isWin: isCorrect,
                userId: data.userId
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
    const renderEmptyRows = () => {
        const rows = [];
        for (let i = board.length; i < 6; i++) {
            rows.push(
                <div key={i} className="row empty">
                    {Array(5).fill(null).map((_, j) => (
                        <span key={j} className="tile"></span>
                    ))}
                </div>
            );
        }
        return rows;
    };

    return (
        <div className='maingame'>
            <Sidebar />
            <div className="game-container">
                <p className="welcome">Witaj, <strong>{data.userName}</strong>!</p>
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
                    {renderEmptyRows()}
                </div>

                <div className="controls">
                    <input 
                        maxLength={5} 
                        value={guess} 
                        onChange={e => setGuess(e.target.value.toUpperCase())} 
                        onKeyDown={(e) => { if (e.key === 'Enter') { submitGuess(); }}}
                        disabled={gameOver}
                        placeholder="WPISZ SŁOWO"
                    />
                    <button className="submit" onClick={submitGuess} disabled={gameOver}>Sprawdź</button>
                    {gameOver && <button className="btn-newgame" onClick={startNewGame}>Nowa Gra</button>}
                </div>

                {message && <p className="gamemessage">{message}</p>}

                <div className="account-settings">
                    <button onClick={handleReset}>Resetuj statystyki</button>
                    <button onClick={handleDeleteAccount}>Usuń konto</button>
                </div>
            </div>
        </div>
        
    );
}