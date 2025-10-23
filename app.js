const express = require('express');
const socketIO = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Game state management
const games = new Map();

class ChessGame {
    constructor(gameId) {
        this.gameId = gameId;
        this.chess = new Chess();
        this.players = { white: null, black: null };
        this.spectators = new Set();
        this.moveHistory = [];
        this.gameStartTime = Date.now();
        this.timers = { white: 600000, black: 600000 }; // 10 minutes each
        this.lastMoveTime = Date.now();
        this.activeTimer = null;
    }

    addPlayer(socketId, color) {
        if (color === 'white' || color === 'black') {
            this.players[color] = socketId;
            return true;
        }
        return false;
    }

    addSpectator(socketId) {
        this.spectators.add(socketId);
    }

    removePlayer(socketId) {
        if (this.players.white === socketId) {
            this.players.white = null;
            this.stopTimer();
        } else if (this.players.black === socketId) {
            this.players.black = null;
            this.stopTimer();
        } else {
            this.spectators.delete(socketId);
        }
    }

    makeMove(move) {
        const result = this.chess.move(move);
        if (result) {
            this.moveHistory.push({
                move: result,
                fen: this.chess.fen(),
                timestamp: Date.now()
            });
            this.updateTimer();
        }
        return result;
    }

    updateTimer() {
        const now = Date.now();
        const elapsed = now - this.lastMoveTime;
        const currentPlayer = this.chess.turn() === 'w' ? 'black' : 'white';
        
        this.timers[currentPlayer] -= elapsed;
        this.lastMoveTime = now;
    }

    startTimer() {
        this.lastMoveTime = Date.now();
    }

    stopTimer() {
        if (this.activeTimer) {
            clearInterval(this.activeTimer);
            this.activeTimer = null;
        }
    }

    getGameState() {
        return {
            fen: this.chess.fen(),
            turn: this.chess.turn(),
            isCheck: this.chess.inCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isDraw: this.chess.isDraw(),
            isStalemate: this.chess.isStalemate(),
            isGameOver: this.chess.isGameOver(),
            moveHistory: this.moveHistory,
            timers: this.timers,
            players: this.players
        };
    }
}

// Express configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Multiplayer Chess',
        gameId: 'default'
    });
});

app.get('/game/:gameId', (req, res) => {
    res.render('index', { 
        title: 'Multiplayer Chess',
        gameId: req.params.gameId
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);
    
    let currentGame = null;
    let playerRole = null;

    socket.on('joinGame', (gameId = 'default') => {
        if (!games.has(gameId)) {
            games.set(gameId, new ChessGame(gameId));
        }

        currentGame = games.get(gameId);
        socket.join(gameId);

        // Assign role
        if (!currentGame.players.white) {
            currentGame.addPlayer(socket.id, 'white');
            playerRole = 'w';
            socket.emit('playerRole', { role: 'w', color: 'white' });
            console.log(`Player ${socket.id} joined as White in game ${gameId}`);
        } else if (!currentGame.players.black) {
            currentGame.addPlayer(socket.id, 'black');
            playerRole = 'b';
            socket.emit('playerRole', { role: 'b', color: 'black' });
            console.log(`Player ${socket.id} joined as Black in game ${gameId}`);
            
            // Start game when both players join
            currentGame.startTimer();
            io.to(gameId).emit('gameStart');
        } else {
            currentGame.addSpectator(socket.id);
            socket.emit('spectatorRole');
            console.log(`Player ${socket.id} joined as Spectator in game ${gameId}`);
        }

        // Send current game state
        socket.emit('gameState', currentGame.getGameState());
        io.to(gameId).emit('playersUpdate', {
            white: currentGame.players.white !== null,
            black: currentGame.players.black !== null,
            spectators: currentGame.spectators.size
        });
    });

    socket.on('move', (moveData) => {
        if (!currentGame) return;

        const turn = currentGame.chess.turn();
        const isPlayerTurn = (turn === 'w' && playerRole === 'w') || 
                            (turn === 'b' && playerRole === 'b');

        if (!isPlayerTurn) {
            socket.emit('invalidMove', { reason: 'Not your turn', move: moveData });
            return;
        }

        try {
            const result = currentGame.makeMove(moveData);
            
            if (result) {
                const gameState = currentGame.getGameState();
                io.to(currentGame.gameId).emit('moveMade', {
                    move: result,
                    gameState: gameState
                });

                // Check for game over conditions
                if (gameState.isCheckmate) {
                    io.to(currentGame.gameId).emit('gameOver', {
                        result: 'checkmate',
                        winner: turn === 'w' ? 'black' : 'white'
                    });
                } else if (gameState.isDraw || gameState.isStalemate) {
                    io.to(currentGame.gameId).emit('gameOver', {
                        result: 'draw',
                        reason: gameState.isStalemate ? 'stalemate' : 'draw'
                    });
                } else if (gameState.isCheck) {
                    io.to(currentGame.gameId).emit('check', {
                        player: currentGame.chess.turn()
                    });
                }
            } else {
                socket.emit('invalidMove', { reason: 'Illegal move', move: moveData });
            }
        } catch (error) {
            console.error('Move error:', error);
            socket.emit('invalidMove', { reason: error.message, move: moveData });
        }
    });

    socket.on('resign', () => {
        if (!currentGame || !playerRole) return;

        const winner = playerRole === 'w' ? 'black' : 'white';
        io.to(currentGame.gameId).emit('gameOver', {
            result: 'resignation',
            winner: winner
        });
    });

    socket.on('offerDraw', () => {
        if (!currentGame || !playerRole) return;

        const opponent = playerRole === 'w' ? currentGame.players.black : currentGame.players.white;
        if (opponent) {
            io.to(opponent).emit('drawOffered', { from: playerRole });
        }
    });

    socket.on('acceptDraw', () => {
        if (!currentGame) return;

        io.to(currentGame.gameId).emit('gameOver', {
            result: 'draw',
            reason: 'agreement'
        });
    });

    socket.on('requestRematch', () => {
        if (!currentGame) return;

        const opponent = playerRole === 'w' ? currentGame.players.black : currentGame.players.white;
        if (opponent) {
            io.to(opponent).emit('rematchRequested', { from: playerRole });
        }
    });

    socket.on('acceptRematch', () => {
        if (!currentGame) return;

        currentGame.chess.reset();
        currentGame.moveHistory = [];
        currentGame.timers = { white: 600000, black: 600000 };
        currentGame.startTimer();

        io.to(currentGame.gameId).emit('gameReset', currentGame.getGameState());
    });

    socket.on('chatMessage', (message) => {
        if (!currentGame) return;

        io.to(currentGame.gameId).emit('chatMessage', {
            sender: playerRole || 'spectator',
            message: message,
            timestamp: Date.now()
        });
    });

    socket.on('disconnect', () => {
        console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
        
        if (currentGame) {
            currentGame.removePlayer(socket.id);
            
            io.to(currentGame.gameId).emit('playerDisconnected', {
                role: playerRole
            });

            io.to(currentGame.gameId).emit('playersUpdate', {
                white: currentGame.players.white !== null,
                black: currentGame.players.black !== null,
                spectators: currentGame.spectators.size
            });

            // Clean up empty games
            if (!currentGame.players.white && !currentGame.players.black && currentGame.spectators.size === 0) {
                games.delete(currentGame.gameId);
                console.log(`Game ${currentGame.gameId} deleted (no players)`);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║   Chess Server Running Successfully   ║
    ╠═══════════════════════════════════════╣
    ║   Port: ${PORT.toString().padEnd(30)}║
    ║   URL: http://localhost:${PORT.toString().padEnd(19)}║
    ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)}║
    ╚═══════════════════════════════════════╝
    `);
});
