import React, { Suspense, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './context/AppContext.jsx';
import TopBar from './components/TopBar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import GamePage from './pages/GamePage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import { useAuth0 } from "@auth0/auth0-react";


const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return <div>Ładowanie...</div>;
    }
    return isAuthenticated
        ? children : <Navigate to="/login" replace />;
};

export default function Layout() {
    const { userName } = useContext(AppContext);
    const { isAuthenticated, user, logout } = useAuth0();

    return (
        <div className="main">
            <TopBar />
            <div className="mainroutes">
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={ isAuthenticated ? <Navigate to="/game" replace /> : <LoginPage />}/>
                        <Route path="/game" element={
                            <ProtectedRoute><GamePage /></ProtectedRoute>
                        } />
                        <Route path="/stats" element={
                            <ProtectedRoute><StatisticsPage /></ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}