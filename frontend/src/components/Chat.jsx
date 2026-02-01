import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import socket from '../socket';

export default function Chat() {
    const { userName, activeRoom } = useContext(AppContext);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);

    useEffect(() => {
        // Czyścimy historię przy zmianie pokoju
        setChatHistory([]);
        socket.on('receive_message', (data) => {
            setChatHistory((prev) => [...prev, data]);
        });

        return () => socket.off('receive_message');
    }, [activeRoom]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim()) {
            socket.emit('send_message', {
                room: activeRoom,
                user: userName,
                message: message
            });
            setMessage('');
        }
    };

    return (
        <div className="chat-container">
            <h4>Czat: {activeRoom}</h4>
            <div className="chat-messages">
                {chatHistory.map((msg, i) => (
                    <div key={i} className="chat-msg">
                        <small>[{msg.timestamp}]</small> <strong>{msg.user}:</strong> {msg.message}
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage}>
                <input 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Napisz coś..."
                />
                <button type="submit">Wyślij</button>
            </form>
        </div>
    );
}