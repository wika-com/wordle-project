import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from "../context/AppContext.jsx";
import "./StatisticsPage.css";
import { useAuth0 } from "@auth0/auth0-react";

export default function StatisticsPage() {
    const { user, getAccessTokenSilently } = useAuth0();
    const roles = user?.["https://wordle-api/roles"] || [];
    const isAdmin = roles.includes("admin");
    const data = useContext(AppContext);
    const nav = useNavigate();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStats = async () => {
        setLoading(true);
        try {
            const url = searchTerm ? `http://localhost:3000/api/search/${searchTerm}` : 'http://localhost:3000/api/stats';
            const res = await axios.get(url);
            const sortedData = res.data.sort((a, b) => b.score - a.score);
            setStats(sortedData);
        } catch (err) {
            console.error("Błąd podczas pobierania statystyk", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStats();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Czy na pewno usunąć tego użytkownika?")) return;
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: "https://wordle-api",
                    scope: "play:game",
                },
            });
            const res = await axios.delete(
                `http://localhost:3000/api/admin/users/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            alert(res.data.message);
            fetchStats();
        } catch (err) {
            alert("Brak uprawnień albo błąd serwera.");
        }
    };

    const handleResetAllStats = async () => {
        if (!window.confirm("Czy na pewno zresetować statystyki wszystkich użytkowników?")) return;
        try {
            const token = await getAccessTokenSilently({
                authorizationParams: {
                    audience: "https://wordle-api",
                    scope: "play:game",
                },
            });
            const res = await axios.put(
                "http://localhost:3000/api/admin/stats/reset",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            alert(res.data.message);
            fetchStats();
        } catch (err) {
            alert("Brak uprawnień albo błąd serwera.");
        }
    };

    return (
        <div className="statsContainer">
            <h1 className="statsName">Ranking Graczy</h1>
            <div className="searchBox">
                <input 
                    type="text" 
                    placeholder="Wyszukaj gracza..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="searchplayer"
                />
            </div>
            {loading ? (
                <div className="loader">Ładowanie danych...</div>
            ) : (
                <div className="table">
                    <table className="statsTable">
                        <thead>
                            <tr>
                                <th>Poz.</th>
                                <th>Użytkownik</th>
                                <th style={{ textAlign: 'right' }}>Wygrane</th>
                                <th>Opcje</th>

                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((user, index) => (
                                <tr key={user.id} className={user.username === data.userName ? "currentUser" : ""}>
                                    <td>{index + 1}.</td>
                                    <td>{user.username} {user.username === data.userName && "(Ty)"}</td>
                                    <td style={{ textAlign: 'right' }}>{user.score}</td>
                                    {isAdmin && (
                                        <td> <button className="usun" onClick={() => handleDeleteUser(user.id)}>
                                            Usuń
                                        </button> </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {isAdmin && (
                        <div className="adminPanel">
                            <h3>Panel administratora</h3>

                            <button className="reset" onClick={handleResetAllStats}>
                                Resetuj statystyki wszystkich
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}