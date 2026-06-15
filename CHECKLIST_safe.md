# Wordle Multiplayer OAuth

Autor: Wiktoria Woronecka

## Uruchomienie

1. docker compose up -d
2. cd backend
4. node server.js
5. cd frontend
7. npm run dev

## Auth0

Authorization Server: Auth0 

1. Backend zabezpieczony OAuth 2.0
Backend Node.js/Express jest zabezpieczony middlewarem Auth0:
->server.js
```
   const checkJwt = auth({
    audience: "https://wordle-api",
    issuerBaseURL: "https://dev-5ln5q8rhsoy0fkmx.us.auth0.com/",
    });
```
Endpointy wymagające zalogowania używają checkJwt, czyli przyjmują tylko poprawny access token wydany przez Auth0.
Role:
- admin
- user

2. Endpoint uwzględniający role użytkownika
```
PUT /api/admin/stats/reset
DELETE /api/admin/users/:id
```

3. Minimum 4 zabezpieczone endpointy
-> server.js
```
POST /api/play
POST /api/new-game
DELETE /api/user
PUT /api/admin/stats/reset
DELETE /api/admin/users/:id
GET /api/stats
GET /api/search/:pattern
```

4. Minimum 1 niezabezpieczony endpoint
```
GET /health
GET /ready
```
Nie wymagają tokena i można je wywołać bez logowania.

5. Frontend korzystający z backendu
Frontend React korzysta z backendu przez axios.
Po zalogowaniu Auth0 frontend pobiera token:
*getAccessTokenSilently()* (GamPage)
i wysyła go w nagłówku:
*Authorization: Bearer <token>* (server)
do chronionych endpointów backendu.

6. Baza danych
Projekt korzysta z *PostgreSQL*.
W bazie przechowywani są użytkownicy i ich wyniki:
users:
- id
- username
- password
- score
Po wygranej wynik użytkownika jest aktualizowany w bazie.

7. Skonfigurowany authorization server
Authorization serverem jest Auth0.
W Auth0 skonfigurowano:
```
Application: Wordle Frontend
API: Wordle API
Audience: https://wordle-api
Role: admin, user
Scope: play:game
```


8. PKCE
PKCE jest włączone, ponieważ aplikacja frontendowa jest typu Single Page Application i korzysta z Auth0 React SDK.
Klient generuje code verifier i code challenge. Auth0 wydaje kod autoryzacyjny tylko aplikacji, która później przedstawi poprawny code verifier. 
Dzięki temu przechwycenie samego authorization code nie pozwala uzyskać tokenu.

- React generuje losowy code_verifier
- Z niego tworzy (hash) code_challenge
- Do Auth0 wysyłany jest code_challenge
- Po zalogowaniu Auth0 zwraca authorization code.
- React wymienia code na token, ale musi wysłać code_verifier.
- Auth0 sprawdza, czy code_verifier pasuje do code_challenge.

9. Docker
Docker Compose dla PostgreSQL

10. Inny authorization server niż Keycloak
*Auth0*

11. Wolumen danych dla authorization servera
Trwałość danych użytkowników, ról i konfiguracji OAuth zapewnia platforma Auth0. Wolumen byłby potrzebny do keycloaka.