import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';

export default function LoginPage() {
    // Stany przeniesione bezpośrednio z Twojego App.jsx
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    
    // Pobieramy funkcję login z kontekstu
    const data = useContext(AppContext);
    const nav = useNavigate();

    // Logika handleRegister z Twojego App.jsx
    const handleRegister = async () => {
        try {
            await axios.post('http://localhost:3000/api/register', { username, password });
            alert("Zarejestrowano!");
        } catch (err) {
            alert(err.response?.data?.error || "Błąd rejestracji");
        }
    };

    // Logika handleLogin z Twojego App.jsx zintegrowana z nawigacją
    const handleLogin = async () => {
        try {
            const res = await axios.post('http://localhost:3000/api/login', { username, password });
            
            // Zapisujemy dane przez AppContext (to ustawi token i localStorage)
            if (data.login) {
                data.login(res.data.username, res.data.token);
            }

            setMessage("Zalogowano pomyślnie!");
            
            // Przekierowanie do gry po udanym logowaniu
            nav("/game");
        } catch (err) {
            alert("Błąd logowania");
        }
    };
    return (
        <div className="App"> {/* Zachowujemy Twoją klasę App dla spójności stylów */}
            <h1>Wordle Pro Project</h1>
            <div className="auth-container">
                <input 
                    placeholder="Username" 
                    onChange={e => setUsername(e.target.value)} 
                    value={username}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    onChange={e => setPassword(e.target.value)} 
                    value={password}
                />
                <button onClick={handleRegister}>Register</button>
                <button onClick={handleLogin}>Login</button>
            </div>
            {message && <p className="message">{message}</p>}
        </div>
    );
}