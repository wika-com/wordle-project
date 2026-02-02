import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';
import "./LoginPage.css"
import { toast } from 'react-toastify';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const data = useContext(AppContext);
    const nav = useNavigate();

    const handleRegister = async () => {
        try {
            const nameClean = (username || "").trim();
            if (!nameClean) {
                toast.error("Niepoprawna nazwa użytkownika");
                return;
            }
            if (nameClean.length<=3) {
                toast.error("Za krótki login");
                return;
            }
            if (!/^[A-Za-z0-9ąćęłńóśżź]+$/.test(nameClean)) {
                toast.error("Login zawiera niedozwolone znaki: , ! @ % # * + $ ?");
                return;
            }
            await axios.post('http://localhost:3000/api/register', { username:nameClean, password });
            toast.success("Zarejestrowano!");
        } catch (err) {
            toast.error("Błąd rejestracji");
        }
    };

    // const handleLogin = async () => {
    //     setMessage("");
    //     try {
    //         const res = await axios.post('http://localhost:3000/api/login', { username, password });
    //         // dane przez AppContext (to ustawi token i localStorage)
    //         if (data.login) {
    //             data.login(res.data.username, res.data.token);
    //         }
    //         setMessage("Zalogowano pomyślnie!");
    //         toast.success("Zalogowano");
    //         nav("/game");
    //     } catch (err) {
    //         toast.error("Niepoprawny login..");
    //         console.error("Błąd logowania:", err);
    //     }
    // };

    const handleLogin = async () => {
    setMessage("");
    try {
        const res = await axios.post('http://localhost:3000/api/login', { 
            username, 
            password 
        });
        
        data.login(res.data.username, res.data.token, res.data.userId);
        setMessage("Zalogowano pomyślnie!");
        toast.success("Zalogowano!");
        setTimeout(() => {
            nav("/game");
        }, 100);
        
    } catch (err) {
        toast.error("Niepoprawny login lub hasło");
        console.error("Błąd logowania:", err.response?.data || err.message);
        }
    };
    return (
        <div className="App" id="block">
            <div className='logo'>
                <h1>Guessit</h1>
            </div>
            <div id='stack'>
                <h3 id="text">Login</h3>
                <div className="box">
                    <input placeholder="Username" onChange={e => setUsername(e.target.value)} value={username}/>
                    <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} value={password}/>
                    <button id="button" value="name" onClick={handleRegister}>Register</button>
                    <button id="button" onClick={handleLogin}>Login</button>
                </div>
            </div>
            {message && <p className="message">{message}</p>}
        </div>
    );
}