import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { ToastContainer } from 'react-toastify';
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
        <ToastContainer 
        position="bottom-right" 
        autoClose={2000} 
        reverseOrder={true}
        theme="colored" 
        />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;