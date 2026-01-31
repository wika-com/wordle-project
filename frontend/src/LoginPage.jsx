import {Typography, Paper, TextField, Button, Stack, Box} from '@mui/material';
import {useContext, useState} from "react";
import {AppContext} from "../context/AppContext.jsx";
import {useNavigate} from "react-router-dom";
import "../styles/LoginPage.css";
import * as Yup from 'yup';
import axios from 'axios';

export default function LoginPage(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [message, setMessage] = useState('');
    const data = useContext(AppContext);
    const nav= useNavigate();
    const [name,setName] = useState("");
    const LoginSchema = Yup.object().shape({
        name: Yup.string()
            .trim()
            .required("Niepoprawny login..")
            .min(4, "Za krótki login")
            .matches(
                /.*[,!?@%#$+*]*$/,
                "Login zawiera niedozwolone znaki: , ! @ % # * + $ ?"
            )
    });

    const handleRegister = async () => {
        try {
            await axios.post('http://localhost:3000/api/register', { username, password });
            alert("Zarejestrowano!");
        } catch (err) {
            alert(err.response.data.error);
        }
        };

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/login', { username, password });
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      if (data.setUsername) {
        data.setUsername(res.data.username);
      }
      setMessage("Zalogowano pomyślnie!");
      nav("/game");
    } catch (err) {
      alert("Błąd logowania");
    }
  };

    return (
        <Paper id="block">
            <Box id="box">
                {!token ? (
                    <Box className="auth-container">
                    <TextField placeholder="Username" onChange={e => setUsername(e.target.value)} />
                    <TextField type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
                    <Button onClick={handleRegister}>Register</Button>
                    <Button onClick={handleLogin}>Login</Button>
                </Box>) : null}
                {/* <Typography id="text" variant="h3">Login</Typography>
                <Stack direction="row" spacing={2}>
                    <TextField label="Login" variant="outlined" onChange={(el) => setName(el.target.value)}/>
                    <Button id="button" variant="contained" onClick={handleLogin}>Zaloguj</Button>
                </Stack> */}
            </Box>
        </Paper>
    );
}