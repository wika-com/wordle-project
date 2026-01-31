import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.jsx'
import React, {useContext, useEffect} from "react";
import ReactDOM from "react-dom/client";
import Layout from "./Layout.jsx";
import {BrowserRouter} from "react-router-dom";
import {AppProvider, AppContext} from "./context/AppContext.jsx";
import { ToastContainer } from "react-toastify";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
    
//   </StrictMode>,
// )
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
             {/*Wykorzystanie biblioteki React Router*/}
            <AppProvider>
              <CssBaseline />
              <ToastContainer position="bottom-right" autoClose={2000} reverseOrder={false} />
              <Layout />
            </AppProvider>
        </BrowserRouter>
    </React.StrictMode>
);
