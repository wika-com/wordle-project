import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {Auth0Provider} from "@auth0/auth0-react";

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <Auth0Provider
          domain="dev-5ln5q8rhsoy0fkmx.us.auth0.com"
          clientId="hRH7vjbSi6dz5bUPLyoo6L2koHFxMsPQ"
          authorizationParams={{ redirect_uri: "http://localhost:5173/game", audience: "https://wordle-api",  scope: "openid profile email play:game",}}
      >
        <App />
      </Auth0Provider>
  </StrictMode>,
)
