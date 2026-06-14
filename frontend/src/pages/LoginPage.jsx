import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "./LoginPage.css";

export default function LoginPage() {
    const {
        loginWithRedirect,
        isAuthenticated,
        isLoading,
        user
    } = useAuth0();
    const nav = useNavigate();
    useEffect(() => {
        if (isAuthenticated) {
            nav("/game");
        }
    }, [isAuthenticated, nav]);
    if (isLoading) {
        return <p>Ładowanie...</p>;
    }
    return (
        <div className="App" id="block">
            <div className="logo">
                <h1>Guessit</h1>
            </div>
            <div id="stack">
                <h3 id="text">Login</h3>
                {!isAuthenticated ? (
                    <button
                        id="button"
                        onClick={() => loginWithRedirect()}
                    >
                        Zaloguj
                    </button>
                ) : (
                    <p>Zalogowano jako: {user?.name || user?.email}</p>
                )}
            </div>
        </div>
    );
}