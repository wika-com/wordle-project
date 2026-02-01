import React, { createContext, useState } from 'react';
import Cookies from 'js-cookie'

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [userName, setUserName] = useState(Cookies.get('username') || null);
    const [token, setToken] = useState(Cookies.get('token') || null);
    const [activeRoom, setActiveRoom] = useState('Globalny');

    const login = (user, tkn) => {
        setUserName(user);
        setToken(tkn);
        Cookies.set('username', user,{expires:1, sameSite:'strict'});
        Cookies.set('token', tkn, {expires:1, sameSite:'strict'});
    };

    const logout = () => {
        setUserName(null);
        setToken(null);
        Cookies.remove('username');
        Cookies.remove('token');
    };

    return (
        <AppContext.Provider value={{ userName, token, login, logout, activeRoom, setActiveRoom }}>
            {children}
        </AppContext.Provider>
    );
};