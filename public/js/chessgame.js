// Modern Chess Game Client with GSAP Animations
console.log("🎮 ChessElite Client Loading...");

// Check dependencies
if (typeof io === 'undefined' || typeof Chess === 'undefined' || typeof gsap === 'undefined') {
    console.error("❌ Required dependencies not loaded");
    alert("Failed to load required libraries. Please refresh the page.");
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

function initGame() {
    console.log("✅ Initializing ChessElite...");
    try {
        new ChessGameClient();
    } catch (error) {
        console.error("❌ Initialization failed:", error);
        showCriticalError("Failed to start game: " + error.message);
    }
}

class ChessGameClient {
    constructor() {
        // Core game state
        this.socket = io();
        this.chess = new Chess();
        this.playerRole = null;
        this.gameId = this.getGameIdFromURL();
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.moveCount = 0;
        this.gameStartTime = null;
        this.timerInterval = null;
        
        // DOM elements
        this.initializeElements();
        
        // Setup
        this.setupEventListeners();
        this.setupSocketListeners();
        this.setupAnimations();
        
        // Initial render
        this.renderBoard();
        this.animatePageLoad();
        
        // Join game
        this.joinGame();
        
        console.log("✅ ChessElite initialized successfully");
    }

    getGameIdFromURL() {
        const path = window.location.pathname;
        const match = path.match(/\/game\/([^\/]+)/);
        return match ? match[1] : 'default';
    }

    initializeElements() {
        this.elements = {
            board: document.getElementById('chessboard'),
            roleInfo: document.getElementById('roleInfo'),
            statusInfo: document.getElementById('statusInfo'),
            turnIndicator: document.getElementById('turnIndicator'),
            moveHistory: document.getElementById('moveHistory'),
            capturedWhite: document.getElementById('capturedWhite'),
            capturedBlack: document.getElementById('capturedBlack'),
            whiteTimer: document.getElementById('whiteTimer'),
            blackTimer: document.getElementById('blackTimer'),
            whiteTimerBar: document.getElementById('whiteTimerBar'),
            blackTimerBar: document.getElementById('blackTimerBar'),
            connectionStatus: document.getElementById('connectionStatus'),
            playersStatus: document.getElementById('playersStatus'),
            moveCount: document.getElementById('moveCount'),
            gameTime: document.getElementById('gameTime'),
            whiteAdvantage: document.getElementById('whiteAdvantage'),
            blackAdvantage: document.getElementById('blackAdvantage'),
            gameOverModal: document.getElementById('gameOverModal'),
            toastContainer: document.getElementById('toastContainer')
        };

        if (!this.elements.board) {
            throw new Error("Chess board element not found");
        }
    }

    setupEventListeners() {
        // Control buttons
        const buttons = {
            flipBoard: document.getElementById('flipBoardBtn'),
            resign: document.getElementById('resignBtn'),
            draw: document.getElementById('drawBtn'),
            copyLink: document.getElementById('copyLinkBtn'),
            rematch: document.getElementById('rematchBtn'),
            modalRematch: document.getElementById('modalRematchBtn'),
            modalClose: document.getElementById('modalCloseBtn')
        };

        if (buttons.flipBoard) buttons.flipBoard.onclick = () => this.flipBoard();
        if (buttons.resign) buttons.resign.onclick = () => this.resign();
        if (buttons.draw) buttons.draw.onclick = () => this.offerDraw();
        if (buttons.copyLink) buttons.copyLink.onclick = () => this.copyGameLink();
        if (buttons.rematch) buttons.rematch.onclick = () => this.requestRematch();
        if (buttons.modalRematch) buttons.modalRematch.onclick = () => this.requestRematch();
        if (buttons.modalClose) buttons.modalClose.onclick = () => this.closeModal();

        // History navigation
        const historyButtons = {
            first: document.getElementById('firstMoveBtn'),
            prev: document.getElementById('prevMoveBtn'),
            next: document.getElementById('nextMoveBtn'),
            last: document.getElementById('lastMoveBtn')
        };

        if (historyButtons.first) historyButtons.first.onclick = () => this.navigateHistory('first');
        if (historyButtons.prev) historyButtons.prev.onclick = () => this.navigateHistory('prev');
        if (historyButtons.next) historyButtons.next.onclick = () => this.navigateHistory('next');
        if (historyButtons.last) historyButtons.last.onclick = () => this.navigateHistory('last');
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Connected:', this.socket.id);
            this.updateConnectionStatus(true);
            this.showToast('Connected to server', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected');
            this.updateConnectionStatus(false);
            this.showToast('Connection lost. Reconnecting...', 'error');
        });

        this.socket.on('playerRole', (data) => {
            console.log('🎭 Role assigned:', data);
            this.playerRole = data.role;
            this.updateRoleDisplay(data);
            this.renderBoard();
        });

        this.socket.on('spectatorRole', () => {
            console.log('👁️ Spectator mode');
            this.playerRole = null;
            this.updateRoleDisplay({ role: 'spectator' });
            this.renderBoard();
        });

        this.socket.on('gameState', (state) => {
            console.log('📊 Game state received');
            this.chess.load(state.fen);
            this.updateGameState(state);
            this.renderBoard();
        });

        this.socket.on('gameStart', () => {
            console.log('🎮 Game started');
            this.gameStartTime = Date.now();
            this.startGameTimer();
            this.showToast('Game started! Good luck!', 'success');
            this.animateGameStart();
        });

        this.socket.on('moveMade', (data) => {
            console.log('♟️ Move:', data.move.san);
            this.chess.move(data.move);
            this.updateGameState(data.gameState);
            this.renderBoard();
            this.addMoveToHistory(data.move);
            this.animateMove(data.move);
            this.moveCount++;
            if (this.elements.moveCount) {
                this.elements.moveCount.textContent = Math.floor(this.moveCount / 2);
            }
        });

        this.socket.on('invalidMove', (data) => {
            console.log('⚠️ Invalid move:', data.reason);
            this.showToast(`Invalid move: ${data.reason}`, 'error');
            this.clearSelection();
            this.animateError();
        });

        this.socket.on('check', () => {
            console.log('⚔️ Check!');
            this.showToast('Check!', 'warning');
            this.animateCheck();
        });

        this.socket.on('gameOver', (data) => {
            console.log('🏁 Game over:', data);
            this.handleGameOver(data);
        });

        this.socket.on('playersUpdate', (data) => {
            this.updatePlayersStatus(data);
        });

        this.socket.on('playerDisconnected', (data) => {
            this.showToast(`${data.role === 'w' ? 'White' : 'Black'} player disconnected`, 'warning');
        });

        this.socket.on('drawOffered', () => {
            this.showToast('Draw offered by opponent', 'info');
            this.showDrawDialog();
        });

        this.socket.on('rematchRequested', () => {
            this.showToast('Rematch requested', 'info');
        });

        this.socket.on('gameReset', (state) => {
            this.chess.load(state.fen);
            this.renderBoard();
            this.resetGame();
            this.showToast('Game reset! Good luck!', 'success');
        });
    }

    setupAnimations() {
        // GSAP timeline for page load
        this.pageLoadTimeline = gsap.timeline({ paused: true });
        
        // Animate gradient orbs
        gsap.to('.orb-1', {
            x: '+=50',
            y: '-=50',
            duration: 20,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        gsap.to('.orb-2', {
            x: '-=40',
            y: '+=40',
            duration: 15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });

        gsap.to('.orb-3', {
            x: '+=30',
            y: '+=30',
            duration: 18,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }

    animatePageLoad() {
        gsap.from('.game-header', {
            y: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        });

        gsap.from('.board-wrapper', {
            scale: 0.9,
            opacity: 0,
            duration: 1,
            delay: 0.2,
            ease: 'back.out(1.2)'
        });

        gsap.from('.left-sidebar', {
            x: -50,
            opacity: 0,
            duration: 0.8,
            delay: 0.4,
            ease: 'power3.out'
        });

        gsap.from('.right-sidebar', {
            x: 50,
            opacity: 0,
            duration: 0.8,
            delay: 0.4,
            ease: 'power3.out'
        });

        gsap.from('.game-controls .control-btn', {
            y: 20,
            opacity: 0,
            duration: 0.5,
            delay: 0.6,
            stagger: 0.1,
            ease: 'power3.out'
        });
    }

    animateGameStart() {
        gsap.from('.chessboard', {
            rotationY: 180,
            duration: 1.5,
            ease: 'power2.inOut'
        });

        this.showToast('⚔️ Battle begins!', 'success');
    }

    animateMove(move) {
        const fromSquare = document.querySelector(`[data-square="${move.from}"]`);
        const toSquare = document.querySelector(`[data-square="${move.to}"]`);

        if (toSquare) {
            gsap.fromTo(toSquare, 
                { scale: 1.2, backgroundColor: 'rgba(0, 212, 255, 0.5)' },
                { scale: 1, backgroundColor: 'transparent', duration: 0.5, ease: 'power2.out' }
            );
        }

        // Piece animation
        const piece = toSquare?.querySelector('.piece');
        if (piece) {
            gsap.from(piece, {
                scale: 0,
                rotation: 360,
                duration: 0.5,
                ease: 'back.out(2)'
            });
        }
    }

    animateCheck() {
        const kingSquares = document.querySelectorAll('.square');
        kingSquares.forEach(square => {
            const piece = square.querySelector('.piece');
            if (piece && piece.textContent.includes('♔') || piece?.textContent.includes('♚')) {
                gsap.to(square, {
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    duration: 0.3,
                    yoyo: true,
                    repeat: 3
                });
                
                gsap.to(piece, {
                    scale: 1.2,
                    rotation: '+=5',
                    duration: 0.15,
                    yoyo: true,
                    repeat: 5
                });
            }
        });
    }

    animateError() {
        gsap.to('.board-wrapper', {
            x: -10,
            duration: 0.1,
            yoyo: true,
            repeat: 3,
            ease: 'power1.inOut'
        });
    }

    animateCapture(square) {
        const squareElement = document.querySelector(`[data-square="${square}"]`);
        if (squareElement) {
            const particles = this.createCaptureParticles(squareElement);
            
            gsap.to(particles, {
                opacity: 0,
                y: -50,
                scale: 0,
                duration: 1,
                stagger: 0.05,
                ease: 'power2.out',
                onComplete: () => particles.forEach(p => p.remove())
            });
        }
    }

    createCaptureParticles(element) {
        const particles = [];
        const rect = element.getBoundingClientRect();
        
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
                width: 8px;
                height: 8px;
                background: linear-gradient(135deg, #00d4ff, #7c3aed);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
            `;
            document.body.appendChild(particle);
            particles.push(particle);
            
            const angle = (360 / 8) * i;
            gsap.to(particle, {
                x: Math.cos(angle * Math.PI / 180) * 50,
                y: Math.sin(angle * Math.PI / 180) * 50,
                duration: 0.8,
                ease: 'power2.out'
            });
        }
        
        return particles;
    }

    joinGame() {
        console.log('🎮 Joining game:', this.gameId);
        this.socket.emit('joinGame', this.gameId);
    }

    renderBoard() {
        if (!this.elements.board) return;
        
        this.elements.board.innerHTML = '';
        const board = this.chess.board();
        const isFlipped = this.playerRole === 'b';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const displayRow = isFlipped ? 7 - row : row;
                const displayCol = isFlipped ? 7 - col : col;
                const piece = board[displayRow][displayCol];
                
                const squareElement = this.createSquareElement(displayRow, displayCol, piece);
                this.elements.board.appendChild(squareElement);
            }
        }

        this.updateTurnIndicator();
    }

    createSquareElement(row, col, piece) {
        const square = document.createElement('div');
        const isLight = (row + col) % 2 === 0;
        const squareNotation = this.getSquareNotation(row, col);
        
        square.className = `square ${isLight ? 'light' : 'dark'}`;
        square.dataset.row = row;
        square.dataset.col = col;
        square.dataset.square = squareNotation;

        // Add coordinate labels
        if (col === 0) {
            const rankLabel = document.createElement('div');
            rankLabel.className = 'rank-label';
            rankLabel.textContent = 8 - row;
            square.appendChild(rankLabel);
        }
        if (row === 7) {
            const fileLabel = document.createElement('div');
            fileLabel.className = 'file-label';
            fileLabel.textContent = String.fromCharCode(97 + col);
            square.appendChild(fileLabel);
        }

        // Highlight selected square
        if (this.selectedSquare === squareNotation) {
            square.classList.add('selected');
        }

        // Show possible moves
        if (this.possibleMoves.includes(squareNotation)) {
            const indicator = document.createElement('div');
            indicator.className = piece ? 'capture-indicator' : 'move-indicator';
            square.appendChild(indicator);
        }

        // Add piece
        if (piece) {
            const pieceElement = this.createPieceElement(piece);
            square.appendChild(pieceElement);
        }

        // Click handler
        square.addEventListener('click', () => this.handleSquareClick(squareNotation));

        return square;
    }

    createPieceElement(piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `piece ${piece.color === 'w' ? 'white' : 'black'}`;
        pieceEl.innerHTML = this.getPieceUnicode(piece);
        
        // Add drag functionality
        pieceEl.draggable = true;
        pieceEl.addEventListener('dragstart', (e) => {
            const square = e.target.closest('.square').dataset.square;
            if (this.canMovePiece(piece)) {
                this.selectSquare(square);
                e.dataTransfer.effectAllowed = 'move';
            } else {
                e.preventDefault();
            }
        });
        
        return pieceEl;
    }

    canMovePiece(piece) {
        if (!this.playerRole) return false;
        if (this.chess.isGameOver()) return false;
        return piece.color === this.playerRole;
    }

    handleSquareClick(square) {
        if (!this.playerRole) return;

        const piece = this.chess.get(square);
        const isOwnPiece = piece && piece.color === this.playerRole;

        if (this.selectedSquare) {
            if (this.selectedSquare === square) {
                this.clearSelection();
            } else if (this.possibleMoves.includes(square)) {
                this.makeMove(this.selectedSquare, square);
            } else if (isOwnPiece) {
                this.selectSquare(square);
            } else {
                this.clearSelection();
            }
        } else if (isOwnPiece && this.chess.turn() === this.playerRole) {
            this.selectSquare(square);
        }
    }

    selectSquare(square) {
        this.selectedSquare = square;
        this.possibleMoves = this.chess.moves({ square, verbose: true }).map(m => m.to);
        this.renderBoard();

        // Animate selection
        const squareEl = document.querySelector(`[data-square="${square}"]`);
        if (squareEl) {
            gsap.from(squareEl, {
                scale: 1.1,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    }

    clearSelection() {
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.renderBoard();
    }

    makeMove(from, to) {
        const move = { from, to, promotion: 'q' };
        console.log("Making move:", move);
        
        // Check if capture
        const capturedPiece = this.chess.get(to);
        if (capturedPiece) {
            this.animateCapture(to);
        }
        
        this.socket.emit('move', move);
        this.clearSelection();
    }

    getSquareNotation(row, col) {
        return `${String.fromCharCode(97 + col)}${8 - row}`;
    }

    getPieceUnicode(piece) {
        const pieces = {
            'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
            'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙'
        };
        const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
        return pieces[key] || '';
    }

    updateGameState(state) {
        this.updateCapturedPieces();
        this.updateMaterialAdvantage();
        
        if (state.timers) {
            this.updateTimers(state.timers);
        }
        
        if (state.isCheck && this.elements.statusInfo) {
            this.elements.statusInfo.textContent = '⚔️ Check!';
            this.elements.statusInfo.className = 'status-badge check';
        } else if (this.elements.statusInfo) {
            this.elements.statusInfo.textContent = '';
            this.elements.statusInfo.className = 'status-badge';
        }
    }

    updateCapturedPieces() {
        const history = this.chess.history({ verbose: true });
        const captured = { white: [], black: [] };
        
        history.forEach(move => {
            if (move.captured) {
                captured[move.color === 'w' ? 'black' : 'white'].push(move.captured);
            }
        });

        if (this.elements.capturedWhite) {
            this.elements.capturedWhite.innerHTML = this.renderCapturedPieces(captured.white, 'w');
        }
        if (this.elements.capturedBlack) {
            this.elements.capturedBlack.innerHTML = this.renderCapturedPieces(captured.black, 'b');
        }
    }

    renderCapturedPieces(pieces, color) {
        if (pieces.length === 0) {
            return '<span style="opacity: 0.5; font-size: 14px;">None</span>';
        }
        
        return pieces.map(p => {
            const unicode = this.getPieceUnicode({ type: p, color });
            return `<span class="captured-piece">${unicode}</span>`;
        }).join('');
    }

    updateMaterialAdvantage() {
        const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
        const history = this.chess.history({ verbose: true });
        let whiteMaterial = 0;
        let blackMaterial = 0;
        
        history.forEach(move => {
            if (move.captured) {
                const value = pieceValues[move.captured];
                if (move.color === 'w') {
                    whiteMaterial += value;
                } else {
                    blackMaterial += value;
                }
            }
        });

        const diff = whiteMaterial - blackMaterial;
        
        if (this.elements.whiteAdvantage) {
            this.elements.whiteAdvantage.textContent = diff > 0 ? `+${diff}` : '';
            this.elements.whiteAdvantage.style.color = diff > 0 ? '#10b981' : '';
        }
        
        if (this.elements.blackAdvantage) {
            this.elements.blackAdvantage.textContent = diff < 0 ? `+${Math.abs(diff)}` : '';
            this.elements.blackAdvantage.style.color = diff < 0 ? '#10b981' : '';
        }
    }

    updateTimers(timers) {
        this.updateTimerDisplay('white', timers.white);
        this.updateTimerDisplay('black', timers.black);
    }

    updateTimerDisplay(color, ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        const timerEl = this.elements[`${color}Timer`];
        const barEl = this.elements[`${color}TimerBar`];
        
        if (timerEl) {
            const minutesSpan = timerEl.querySelector('.timer-minutes');
            const secondsSpan = timerEl.querySelector('.timer-seconds');
            
            if (minutesSpan) minutesSpan.textContent = minutes;
            if (secondsSpan) secondsSpan.textContent = seconds.toString().padStart(2, '0');
            
            // Change color when time is low
            if (ms < 60000) {
                timerEl.style.color = '#ef4444';
                if (ms < 10000) {
                    gsap.to(timerEl, {
                        scale: 1.1,
                        duration: 0.5,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        }
        
        if (barEl) {
            const percentage = (ms / 600000) * 100;
            gsap.to(barEl, {
                width: `${percentage}%`,
                duration: 1,
                ease: 'power1.out'
            });
        }
    }

    startGameTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (!this.gameStartTime) return;
            
            const elapsed = Date.now() - this.gameStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            if (this.elements.gameTime) {
                this.elements.gameTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    updateTurnIndicator() {
        if (!this.elements.turnIndicator) return;
        
        const turn = this.chess.turn();
        const turnIcon = this.elements.turnIndicator.querySelector('.turn-icon');
        const turnText = this.elements.turnIndicator.querySelector('.turn-text');
        
        if (turnIcon) turnIcon.textContent = turn === 'w' ? '⚪' : '⚫';
        if (turnText) turnText.textContent = `${turn === 'w' ? 'White' : 'Black'} to move`;
        
        // Animate turn change
        gsap.from(this.elements.turnIndicator, {
            scale: 1.1,
            duration: 0.3,
            ease: 'back.out(2)'
        });
    }

    addMoveToHistory(move) {
        if (!this.elements.moveHistory) return;
        
        const moveNumber = Math.floor(this.chess.history().length / 2) + (this.chess.history().length % 2);
        
        const moveItem = document.createElement('div');
        moveItem.className = 'move-item';
        moveItem.innerHTML = `
            <span class="move-number">${moveNumber}.</span>
            <span>${move.color === 'w' ? '⚪' : '⚫'}</span>
            <span>${move.san}</span>
        `;
        
        // Remove empty state if exists
        const emptyState = this.elements.moveHistory.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
        
        this.elements.moveHistory.prepend(moveItem);
        
        // Animate
        gsap.from(moveItem, {
            x: -20,
            opacity: 0,
            duration: 0.5,
            ease: 'power3.out'
        });

        // Scroll to top
        this.elements.moveHistory.scrollTop = 0;
    }

    handleGameOver(data) {
        let title = 'Game Over';
        let message = '';
        let icon = '🏁';
        
        if (data.result === 'checkmate') {
            title = 'Checkmate!';
            icon = '👑';
            message = `${data.winner.charAt(0).toUpperCase() + data.winner.slice(1)} wins by checkmate!`;
        } else if (data.result === 'resignation') {
            title = 'Victory!';
            icon = '🏆';
            message = `${data.winner.charAt(0).toUpperCase() + data.winner.slice(1)} wins by resignation`;
        } else {
            title = 'Draw';
            icon = '🤝';
            message = `Game drawn by ${data.reason}`;
        }
        
        this.showGameOverModal(title, message, icon);
        this.showToast(message, 'info', 5000);
        
        // Show rematch button
        const rematchBtn = document.getElementById('rematchBtn');
        if (rematchBtn) {
            rematchBtn.style.display = 'flex';
            gsap.from(rematchBtn, {
                scale: 0,
                rotation: 360,
                duration: 0.8,
                ease: 'back.out(2)'
            });
        }
        
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    showGameOverModal(title, message, icon) {
        const modal = this.elements.gameOverModal;
        if (!modal) return;
        
        const titleEl = document.getElementById('gameOverTitle');
        const messageEl = document.getElementById('resultMessage');
        const iconEl = document.getElementById('resultIcon');
        
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        if (iconEl) iconEl.textContent = icon;
        
        modal.classList.add('show');
        
        // Animate modal
        gsap.from('.modal', {
            scale: 0.5,
            rotation: -5,
            duration: 0.6,
            ease: 'back.out(2)'
        });
    }

    closeModal() {
        const modal = this.elements.gameOverModal;
        if (modal) {
            gsap.to('.modal', {
                scale: 0.8,
                opacity: 0,
                duration: 0.3,
                onComplete: () => modal.classList.remove('show')
            });
        }
    }

    updateRoleDisplay(data) {
        if (!this.elements.roleInfo) return;
        
        const badgeDot = this.elements.roleInfo.querySelector('.badge-dot');
        const badgeText = this.elements.roleInfo.querySelector('.badge-text');
        
        let text = '';
        let color = '';
        
        if (data.role === 'w') {
            text = 'Playing as White';
            color = '#f0d9b5';
        } else if (data.role === 'b') {
            text = 'Playing as Black';
            color = '#b58863';
        } else {
            text = 'Spectating';
            color = '#6b7280';
        }
        
        if (badgeText) badgeText.textContent = text;
        if (badgeDot) {
            gsap.to(badgeDot, {
                backgroundColor: color,
                duration: 0.5
            });
        }
    }

    updateConnectionStatus(connected) {
        const indicator = this.elements.connectionStatus;
        if (!indicator) return;
        
        const pulseDot = indicator.querySelector('.pulse-dot');
        const text = indicator.querySelector('.connection-text');
        
        if (connected) {
            indicator.classList.remove('disconnected');
            if (text) text.textContent = 'Connected';
        } else {
            indicator.classList.add('disconnected');
            if (text) text.textContent = 'Disconnected';
        }
    }

    updatePlayersStatus(data) {
        if (!this.elements.playersStatus) return;
        
        const whiteStatus = this.elements.playersStatus.querySelector('[data-player="white"]');
        const blackStatus = this.elements.playersStatus.querySelector('[data-player="black"]');
        
        if (whiteStatus) {
            whiteStatus.className = `status-item ${data.white ? 'active' : 'waiting'}`;
        }
        
        if (blackStatus) {
            blackStatus.className = `status-item ${data.black ? 'active' : 'waiting'}`;
        }
    }

    resign() {
        if (!confirm('Are you sure you want to resign?')) return;
        this.socket.emit('resign');
    }

    offerDraw() {
        this.socket.emit('offerDraw');
        this.showToast('Draw offer sent to opponent', 'info');
    }

    showDrawDialog() {
        if (confirm('Your opponent offers a draw. Do you accept?')) {
            this.socket.emit('acceptDraw');
        }
    }

    requestRematch() {
        this.socket.emit('requestRematch');
        this.showToast('Rematch request sent', 'info');
    }

    copyGameLink() {
        const link = `${window.location.origin}/game/${this.gameId}`;
        
        navigator.clipboard.writeText(link).then(() => {
            this.showToast('✅ Game link copied to clipboard!', 'success');
        }).catch(() => {
            this.showToast('Failed to copy link', 'error');
        });
    }

    flipBoard() {
        this.elements.board.classList.toggle('flipped');
        
        gsap.to(this.elements.board, {
            rotationY: this.elements.board.classList.contains('flipped') ? 180 : 0,
            duration: 0.8,
            ease: 'power2.inOut'
        });
        
        this.showToast('Board flipped', 'info');
    }

    navigateHistory(direction) {
        // Placeholder for history navigation
        this.showToast('History navigation coming soon', 'info');
    }

    resetGame() {
        this.moveCount = 0;
        this.selectedSquare = null;
        this.possibleMoves = [];
        this.gameStartTime = Date.now();
        
        if (this.elements.moveCount) this.elements.moveCount.textContent = '0';
        if (this.elements.moveHistory) {
            this.elements.moveHistory.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">♟️</span>
                    <p>No moves yet</p>
                </div>
            `;
        }
        
        this.closeModal();
        
        const rematchBtn = document.getElementById('rematchBtn');
        if (rematchBtn) rematchBtn.style.display = 'none';
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

function showCriticalError(message) {
    document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0a0e27; color: white; text-align: center; padding: 20px;">
            <div>
                <h1 style="font-size: 48px; margin-bottom: 20px;">⚠️</h1>
                <h2 style="margin-bottom: 10px;">Error Loading Chess Game</h2>
                <p style="color: #9ca3af; margin-bottom: 20px;">${message}</p>
                <button onclick="location.reload()" style="padding: 12px 24px; background: linear-gradient(135deg, #00d4ff, #7c3aed); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        </div>
    `;
}

console.log("✅ ChessElite Client Loaded Successfully");