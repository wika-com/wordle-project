import React, { createContext, useState } from 'react';
import Cookies from 'js-cookie'
import { toast } from 'react-toastify';
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [userName, setUserName] = useState(Cookies.get('username') || null);
    const [token, setToken] = useState(Cookies.get('token') || null);
    const [activeRoom, setActiveRoom] = useState('Globalny');
    const [userId, setUserId] = useState(Cookies.get('userId') || null); 

    const login = (user, tkn, id) => {
        setUserName(user);
        setToken(tkn);
        setUserId(id);
        Cookies.set('username', user,{expires:1, sameSite:'strict'});
        Cookies.set('token', tkn, {expires:1, sameSite:'strict'});
        Cookies.set('userId', id, { expires: 1, sameSite: 'strict' });
    };

    const logout = () => {
        setUserName(null);
        setToken(null);
        setUserId(null);
        Cookies.remove('username');
        Cookies.remove('token');
        Cookies.remove('userId');
    };

    return (
        <AppContext.Provider value={{ userName, token, userId, login, logout, activeRoom, setActiveRoom }}>
            {children}
        </AppContext.Provider>
    );
};