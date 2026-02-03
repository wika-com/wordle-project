import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AppContext } from "../context/AppContext.jsx";
import "./StatisticsPage.css"; 

export default function StatisticsPage() {
    const data = useContext(AppContext);
    const nav = useNavigate();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
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
        const timer = setTimeout(() => {
            fetchStats();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="statsContainer">
            <h1 className="statNname">Ranking Graczy</h1>
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
                            </tr>
                        </thead>
                        <tbody>
                            {stats.map((user, index) => (
                                <tr key={user.id} className={user.username === data.userName ? "currentUser" : ""}>
                                    <td>{index + 1}.</td>
                                    <td>{user.username} {user.username === data.userName && "(Ty)"}</td>
                                    <td style={{ textAlign: 'right' }}>{user.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}