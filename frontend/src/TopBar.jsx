import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from './context/AppContext.jsx';
import './TopBar.css';

export default function TopBar() {
    const data = useContext(AppContext);
    const nav = useNavigate();
    const location = useLocation();

    if (location.pathname === '/login' || !data.userName) {
        return null;
    }

    return (
        <header className="topbar">
            <div className="topbar-left">
                <h1 className="logo">GuessIt</h1>
            </div>
            <nav className="topbar-center">
                <button 
                    className={`link ${location.pathname === '/game' ? 'active' : ''}`}
                    onClick={() => nav('/game')}
                >
                    Gra
                </button>
                <button 
                    className={`nlink ${location.pathname === '/settings' ? 'active' : ''}`}
                    onClick={() => nav('/settings')}
                >
                    Ranking
                </button>
            </nav>
            <div className="topbar-right">
                <span className="user-info">Gracz: <strong>{data.userName}</strong></span>
                <button className="logout-button" onClick={() => {
                    data.logout();
                    nav('/login');
                }}>
                    Wyloguj
                </button>
            </div>
        </header>
    );
}