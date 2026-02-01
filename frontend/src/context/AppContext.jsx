import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [userName, setUserName] = useState(localStorage.getItem('username') || null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    const login = (user, tkn) => {
        setUserName(user);
        setToken(tkn);
        localStorage.setItem('username', user);
        localStorage.setItem('token', tkn);
    };

    const logout = () => {
        setUserName(null);
        setToken(null);
        localStorage.removeItem('username');
        localStorage.removeItem('token');
    };

    return (
        <AppContext.Provider value={{ userName, token, login, logout }}>
            {children}
        </AppContext.Provider>
    );
};