import React, { Suspense, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './context/AppContext.jsx';
import TopBar from './components/TopBar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import GamePage from './pages/GamePage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';

const ProtectedRoute = ({ children }) => {
    const { userName } = useContext(AppContext);
    return userName ? children : <Navigate to="/login" replace />;
};
export default function Layout() {
    const { userName } = useContext(AppContext);

    return (
        <div className="main">
            <TopBar />
            <div className="mainroutes">
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="/login" element={
                            userName ? <Navigate to="/game" replace /> : <LoginPage />
                        } />
                        <Route path="/game" element={
                            <ProtectedRoute><GamePage /></ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute><StatisticsPage /></ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}