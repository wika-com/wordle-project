import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import socket from '../socket';
import "./Chat.css";

export default function Chat() {
    const data = useContext(AppContext);
    const [text, setText] = useState("");
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    // Auto-scroll do dołu
    useEffect(() => {
        setMessages([]);
    }, [data.activeRoom]);

    useEffect(() => {
        const handleMessage = (msg) => {
            console.log("WIadomość:", msg);
            setMessages((prev) => [...prev, msg]);
        };
        socket.on('receive_message', handleMessage);
        return () => {
            socket.off('receive_message', handleMessage);
        };
    }, []);

    const send = () => {
        if (text.trim()) {
            const msgPayload = {
                room: data.activeRoom,
                user: data.userName,
                message: text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            // wysyłamy do serwera
            socket.emit('send_message', msgPayload);
            setText("");
        }
    };

    return (
        <div className="chat">
            <h4>Czat: {data.activeRoom}</h4>
            <div className="window">
                {messages.map((m, index) => (
                    <div key={index} className={m.user === data.userName ? "my" : "them"}>
                        <div className="cloud">
                            <span className="author">{m.user === data.userName ? "Ja" : m.user}</span>
                            <p className="messtext">{m.message}</p>
                            <span className="messtime">{m.timestamp}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="inputArea">
                <input 
                    value={text} 
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Napisz..."
                />
                <button onClick={send}>send</button>
            </div>
        </div>
    );
}