import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Layout from './Layout';
import { io } from "socket.io-client";
import './App.css';
import TopBar from "./components/TopBar.jsx";
const socket = io("http://localhost:3000");

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;