import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import socket from '../socket';
import "./Sidebar.css";
import Chat from './Chat.jsx';

export default function Sidebar() {
  const data = useContext(AppContext);
  const rooms = ['Globalny', 'Pokój 1', 'Pokój 2', 'Eksperci'];

  useEffect(() => {
        if (data.userName) {
            socket.emit('join_room', { room: data.activeRoom, user: data.userName });
        }
    }, [data.userName, data.activeRoom]);
    const changeRoom = (roomName) => {
        data.setActiveRoom(roomName);
        console.log("Zmieniono pokój na:", roomName);
    };

  return (
    <aside className="sidebar">
      <h3>Pokoje Gier</h3>
      <ul className="room-list">
        {rooms.map((room) => (
          <li 
            key={room} 
            className={data.activeRoom === room ? 'active' : ''} 
            onClick={() => changeRoom(room)}
          >
            {room}
          </li>
        ))}
      </ul>
      <div className="sidebar-info">
        <p>Grasz w: <strong>{data.activeRoom}</strong></p>
      </div>
      < Chat />
    </aside>
  );
}