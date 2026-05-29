Gra typu Wordle zorientowana na rywalizację wieloosobową w czasie rzeczywistym. Projekt demonstruje integrację wielu protokołów komunikacyjnych (HTTP, WebSockets, MQTT) oraz dbałość o bezpieczeństwo i wydajność danych w architekturze Full-Stack.

Funkcje:
- Real-Time Multiplayer: Rozgrywka w izolowanych pokojach dzięki Socket.io.
- Protocol Bridging: Autorski mechanizm mostkowania wiadomości między WebSockets a MQTT.
- Bezpieczeństwo: Pełna autoryzacja JWT oraz zahashowane hasła w bazie SQLite.
- Dynamiczne API: Integracja z zewnętrznym API do losowania haseł w różnych językach/pokojach.
- Responsive UI: Nowoczesny interfejs React z powiadomieniami typu Toast.

Stack Techniczny:
  Backend (Node.js/Express):
- Komunikacja: Socket.io (WS), MQTT (HiveMQ), REST API (Express)
- Baza Danych: SQLite3
- Bezpieczeństwo: JSON Web Tokens (JWT), Bcrypt.js (Hashing)
- Logika: Asynchroniczne zarządzanie sesjami pokoi
  Frontend (React):
- State Management: Context API & React Hooks
- Networking: Axios (HTTP) & Socket.io-client
- Stylizacja: CSS / React-Toastify
