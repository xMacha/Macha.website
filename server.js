// server.js
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Inicjalizacja aplikacji Express
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Ustawienie portu (domyślnie 3000)
const port = process.env.PORT || 3000;

// Udostępnianie folderu "public" jako statyczne zasoby
app.use(express.static('public'));

// Zmienna do przechowywania czekającego gracza
let waitingPlayer = null;
// Obiekt przechowujący stany gier – kluczem jest ID pokoju
const games = {};

// Obsługa połączeń
io.on('connection', (socket) => {
  console.log("Nowe połączenie: " + socket.id);

  // Odbieramy wiadomość o dołączeniu do gry
  socket.on('joinGame', (data) => {
    // Ustawiamy pseudonim – domyślnie "Anon" jeśli nie podano
    socket.nickname = data.nickname || "Anon";

    if (waitingPlayer) {
      // Skoro jest już ktoś czekający, dobieramy graczy
      const gameId = waitingPlayer.id + '#' + socket.id;
      waitingPlayer.join(gameId);
      socket.join(gameId);

      // Inicjalizacja stanu gry – rozmiar canvas: 800x400, paletki 10x80, początkowa piłka
      const gameState = {
        ball: { x: 400, y: 200, vx: 4, vy: 2 },
        paddle1: { x: 10, y: 160, width: 10, height: 80 },
        paddle2: { x: 780, y: 160, width: 10, height: 80 },
        score1: 0,
        score2: 0,
        players: {
          1: waitingPlayer.nickname,
          2: socket.nickname
        }
      };
      games[gameId] = gameState;

      // Przypisujemy numery graczom: gracz czekający – numer 1, nowy gracz – numer 2
      waitingPlayer.emit('startGame', { gameId: gameId, player: 1, gameState: gameState });
      socket.emit('startGame', { gameId: gameId, player: 2, gameState: gameState });

      // Uruchamiamy pętlę gry – symulacja odbywa się na serwerze
      const interval = setInterval(() => {
        const state = games[gameId];
        if (!state) {
          clearInterval(interval);
          return;
        }
        // Aktualizacja pozycji piłki
        state.ball.x += state.ball.vx;
        state.ball.y += state.ball.vy;
        // Odbicie od góry i dołu
        if (state.ball.y - 8 < 0 || state.ball.y + 8 > 400) {
          state.ball.vy = -state.ball.vy;
        }
        // Sprawdzenie kolizji z paletką 1
        if (state.ball.x - 8 < state.paddle1.x + state.paddle1.width &&
            state.ball.y > state.paddle1.y &&
            state.ball.y < state.paddle1.y + state.paddle1.height) {
          state.ball.vx = -state.ball.vx;
        }
        // Sprawdzenie kolizji z paletką 2
        if (state.ball.x + 8 > state.paddle2.x &&
            state.ball.y > state.paddle2.y &&
            state.ball.y < state.paddle2.y + state.paddle2.height) {
          state.ball.vx = -state.ball.vx;
        }
        // Warunki zdobycia punktu
        if (state.ball.x < 0) {
          state.score2++;
          // Reset piłki
          state.ball.x = 400;
          state.ball.y = 200;
          state.ball.vx = 4;
          state.ball.vy = 2;
        } else if (state.ball.x > 800) {
          state.score1++;
          state.ball.x = 400;
          state.ball.y = 200;
          state.ball.vx = -4;
          state.ball.vy = 2;
        }
        // Wysyłamy zaktualizowany stan gry do obu graczy
        io.to(gameId).emit('gameState', state);
      }, 1000/60); // 60 fps
      
      // Odbieramy ruch paletki
      socket.on('paddleMove', (data) => {
        const state = games[data.gameId];
        if (state) {
          if (data.player === 1) {
            state.paddle1.y = data.y;
          } else {
            state.paddle2.y = data.y;
          }
        }
      });

      // Obsługa rozłączenia – jeśli któryś z graczy się rozłączy, kończymy grę
      const endGame = () => {
        io.to(gameId).emit('gameOver');
        delete games[gameId];
      };
      socket.on('disconnect', endGame);
      waitingPlayer.on('disconnect', endGame);

      waitingPlayer = null; // resetujemy zmienną czekającego gracza
    } else {
      // Jeśli nikt nie czeka – ustawiamy bieżącego gracza jako czekającego
      waitingPlayer = socket;
      socket.emit('waiting', { message: "Czekaj na przeciwnika..." });
      socket.on('disconnect', () => {
        waitingPlayer = null;
      });
    }
  });
});

// Uruchamiamy serwer
server.listen(port, () => console.log(`Serwer działa na porcie ${port}`));
