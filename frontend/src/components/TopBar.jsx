import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext.jsx';
import './TopBar.css';
import { useAuth0 } from "@auth0/auth0-react";

export default function TopBar() {
    const data = useContext(AppContext);
    const nav = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth0();

    if (location.pathname === "/login" || !isAuthenticated) {
        return null;
    }

    return (
        <header className="topbar" >
            <div className="first">
                <div className="topbar-left">
                    <h1 className="logo2">Guessit</h1>
                </div>
                <nav className="center">
                    <button 
                        id='topbuttom'
                        className={`link ${location.pathname === '/game' ? 'active' : ''}`}
                        onClick={() => nav('/game')}>
                        Gra
                    </button>
                    <button 
                        id='topbuttom'
                        className={`link ${location.pathname === '/stats' ? 'active' : ''}`}
                        onClick={() => nav('/stats')}>
                        Ranking
                    </button>
                </nav>
            </div>
            <div className="right">
                <span className="user">Gracz: <strong>{user?.name || user?.email}</strong></span>
                <button
                    className="logout"
                    onClick={() =>
                        logout({
                            logoutParams: {
                                returnTo: window.location.origin,
                            },})}>
                    Wyloguj
                </button>
            </div>
        </header>
    );
}