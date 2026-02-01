// import React, { useState, useEffect, useContext } from 'react';
// import { AppContext } from '../context/AppContext.jsx';
// import socket from '../socket';

// export default function Chat() {
//     const { userName, activeRoom } = useContext(AppContext);
//     const [message, setMessage] = useState('');
//     const [chatHistory, setChatHistory] = useState([]);
//     const messagesEndRef = React.useRef(null);

//     useEffect(() => {
//     // Bezpośrednie wywołanie scrolla przy każdej zmianie historii
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [chatHistory]);

//     useEffect(() => {
//         setChatHistory([]);
//     }, [activeRoom]);

//     useEffect(() => {
//         const handleNewMessage = (data) => {
//             setChatHistory(prev => [...prev, data]);
//         };
//         socket.on('receive_message', handleNewMessage);
//         return () => {
//             socket.off('receive_message', handleNewMessage);
//         };
//     }, []);

//     // useEffect(() => {
//     //     // Czyścimy historię przy zmianie pokoju
//     //     setChatHistory([]);
//     //     const handleNewMessage = (data) => {
//     //         setChatHistory((prev) => [...prev, data]);
//     //     };
//     //     socket.on('receive_message', handleNewMessage);

//     //     return () => {socket.off('receive_message',handleNewMessage)};
//     // }, [activeRoom]);

//     const sendMessage = (e) => {
//         e.preventDefault();
//         if (message.trim()) {
//             socket.emit('send_message', {
//                 room: activeRoom,
//                 user: userName,
//                 message: message
//             });
//             setMessage('');
//         }
//     };

//     return (
//         <div className="chat-container">
//             <h4>Czat: {activeRoom}</h4>
//             <div className="chat-messages">
//                 {chatHistory.map((msg, i) => (
//                     <div key={i} className="chat-msg">
//                         <small>[{msg.timestamp}]</small> <strong>{msg.user}:</strong> {msg.message}
//                     </div>
//                 ))}
//                 <div ref={messagesEndRef} />
//             </div>
//             <form onSubmit={sendMessage}>
//                 <input 
//                     value={message} 
//                     onChange={(e) => setMessage(e.target.value)} 
//                     placeholder="Napisz coś..."
//                 />
//                 <button type="submit">Wyślij</button>
//             </form>
//         </div>
//     );
// }
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import socket from '../socket';

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
            console.log("📩 MSG:", msg);
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
                text: text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            // Wysyłamy do serwera
            socket.emit('send_message', msgPayload);
            setText("");
        }
    };

    return (
        <div className="sidebar-chat">
            <h4>Czat: {data.activeRoom}</h4>
            <div className="chat-window">
                {messages.map((m, index) => (
                    <div key={index} className={m.user === data.userName ? "my-msg" : "other-msg"}>
                        <div className="msg-cloud">
                            <span className="msg-author">{m.user === data.userName ? "Ja" : m.user}</span>
                            <p className="msg-text">{m.text}</p>
                            <span className="msg-time">{m.time}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="chat-input-area">
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