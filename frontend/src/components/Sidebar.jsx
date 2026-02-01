import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext.jsx';
import socket from '../socket';
import '../Layout.css';

export default function Sidebar() {
  const { userName } = useContext(AppContext);
  const rooms = ['Globalny', 'Pokój 1', 'Pokój 2', 'Eksperci'];
  const [activeRoom, setActiveRoom] = useState('Globalny');

  const changeRoom = (roomName) => {
    setActiveRoom(roomName);
    socket.emit('join_room', { room: roomName, user: userName });
    // Możesz też dodać powiadomienie lokalne
    console.log("Zmieniono pokój na:", roomName);
  };

  return (
    <aside className="sidebar">
      <h3>Pokoje Gier</h3>
      <ul className="room-list">
        {rooms.map((room) => (
          <li 
            key={room} 
            className={activeRoom === room ? 'active' : ''} 
            onClick={() => changeRoom(room)}
          >
            {room}
          </li>
        ))}
      </ul>
      <div className="sidebar-info">
        <p>Grasz w: <strong>{activeRoom}</strong></p>
      </div>
    </aside>
  );
}