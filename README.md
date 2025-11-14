# ♔ ChessElite - Real-Time Multiplayer Chess

A premium multiplayer chess web application with real-time gameplay, modern UI design, smooth animations, and professional-grade features built with Socket.io, Express, and Chess.js.

---

## 📌 What's This Project About?

ChessElite is a **real-time multiplayer chess game** that allows two players to compete against each other online with instant move synchronization. The game features a sleek, modern dark-themed interface with smooth animations, game state management, and spectator mode.

---

## ✨ Features & Functionality

### 🎮 Core Gameplay
- **Real-Time Multiplayer** - Two players can join a game room and play chess in real-time
- **Socket.io Integration** - Instant move synchronization between players with no lag
- **Chess.js Engine** - Complete chess logic with legal move validation
- **Move Validation** - Only legal moves are allowed, with instant feedback
- **Game State Sync** - Board state is always synchronized across all connected clients
- **Spectator Mode** - Additional users can watch ongoing games without interfering
- **Room System** - Multiple game rooms with unique game IDs

### 🎨 Visual & UI Features
- **Modern Dark Theme** - Premium dark color scheme with glassmorphism effects
- **Smooth GSAP Animations** - Page load, move animations, check alerts, and more
- **Drag & Drop** - Intuitive piece movement with visual feedback
- **Interactive Board** - Click or drag pieces with highlight indicators for possible moves
- **Captured Pieces Display** - Shows all captured pieces for both players
- **Material Advantage** - Real-time calculation and display of material advantage
- **Turn Indicators** - Clear visual indication of whose turn it is
- **Check/Checkmate Alerts** - Animated notifications for special game states

### 📊 Game Information
- **Move History** - Complete list of all moves in algebraic notation
- **Move Counter** - Tracks the number of moves made
- **Game Timer** - Displays elapsed game time
- **Captures Counter** - Tracks total captures in the game
- **Checks Counter** - Counts how many times check has occurred
- **Player Information** - Displays usernames and ratings for both players
- **Connection Status** - Real-time connection indicator

### 🎯 Game Controls
- **Flip Board** - Rotate the board view 180 degrees
- **Resign** - Forfeit the current game
- **Offer Draw** - Propose a draw to opponent
- **Share Game Link** - Copy shareable game URL to clipboard
- **Rematch** - Request a new game with the same opponent
- **History Navigation** - Browse through game moves (UI ready)

### 🔔 Notifications & Feedback
- **Toast Notifications** - Success, error, warning, and info messages
- **Animated Modals** - Game over screen with results
- **Player Disconnection Alerts** - Notifies when opponent disconnects
- **Draw Offers** - Interactive draw offer system
- **Sound Feedback** - Visual effects for moves, captures, and checks

---

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime for server-side logic
- **Express.js** - Web application framework
- **Socket.io** - Real-time bidirectional communication
- **Chess.js** - Chess game logic and move validation
- **EJS** - Templating engine for dynamic HTML

### Frontend
- **Vanilla JavaScript (ES6+)** - Client-side game logic
- **CSS3** - Modern styling with custom properties, gradients, and animations
- **HTML5** - Semantic markup
- **GSAP (GreenSock)** - Professional animation library
- **Socket.io Client** - Real-time communication with server

### Development Tools
- **Nodemon** - Auto-restart server during development

---

## 🎓 What I Learned

### Socket.io & Real-Time Communication
- Establishing WebSocket connections between clients and server
- Emitting and listening to custom events
- Broadcasting to specific rooms
- Handling client disconnections gracefully
- Managing game rooms and player assignments
- Synchronizing game state across multiple clients

### Chess Game Logic
- Implementing chess rules using Chess.js library
- Move validation and legal move generation
- Detecting check, checkmate, stalemate, and draw conditions
- Handling special moves (castling, en passant, pawn promotion)
- Calculating material advantage
- Managing game state with FEN notation

### Class-Based Architecture
- Building a `ChessGame` class for server-side game management
- Creating a `ChessGameClient` class for client-side logic
- Encapsulating game state and methods
- Managing multiple game instances with Map data structure

### Advanced UI/UX Design
- Creating glassmorphism effects with backdrop-filter
- Implementing smooth page load animations
- Building responsive layouts with CSS Grid
- Designing interactive hover states and transitions
- Creating toast notification system
- Modal overlay patterns with GSAP animations

### Drag and Drop API
- Implementing native HTML5 drag and drop
- Handling dragstart, dragover, and drop events
- Providing visual feedback during drag operations
- Combining drag-drop with click-based movement

### Game State Management
- Tracking captured pieces
- Calculating material advantage in real-time
- Managing premoves (moves queued for next turn)
- Handling game timers and statistics
- Syncing player information

### Animation Techniques
- GSAP timeline animations for page load
- Animating move execution with scale and rotation
- Creating particle effects for captures
- Pulsing animations for check state
- Shake effects for invalid moves

---

## 📦 Project Structure

```
chess/
├── app.js                      # Express server & Socket.io setup
├── package.json                # Dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── README.md                   # This file
├── views/
│   ├── index.ejs              # Main game template (EJS)
│   └── index.html             # Alternative HTML version (reference)
├── public/
│   ├── css/
│   │   └── style.css          # Main stylesheet (dark theme)
│   └── js/
│       └── chessgame.js       # Client-side game logic
└── node_modules/               # Installed packages
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/anshu-c8NETed/chess.git
cd chess
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

### Production Mode
```bash
npm start
```

---

## 🎮 How to Play

1. **Enter Your Details** - When you open the game, enter your username and rating
2. **Wait for Opponent** - The first player gets White pieces, second gets Black
3. **Make Moves** - Click a piece to select it, then click destination square
4. **Alternative Movement** - Drag and drop pieces to move them
5. **Special Actions** - Use control buttons to resign, offer draw, or flip board
6. **Share Game** - Click "Share" to copy the game link and invite friends
7. **Spectate** - Third+ users can watch the game without playing

---

## 🎯 Key Game Features Explained

### Room System
Each game has a unique ID (default or custom). Navigate to `/game/your-custom-id` to create/join specific games.

### Player Roles
- **White Player** - First player to join the game
- **Black Player** - Second player to join
- **Spectators** - Additional users who can only watch

### Move Indicators
- **Green Dots** - Possible move destinations
- **Red Ring** - Capture move available
- **Yellow Highlight** - Selected piece
- **Gold Overlay** - Last move made

### Premoves
Players can queue their next move before their turn by clicking pieces when it's not their turn.

### Material Counting
The game tracks the total point value of captured pieces:
- Pawn = 1 point
- Knight/Bishop = 3 points
- Rook = 5 points
- Queen = 9 points

---

## 🎨 Design Highlights

### Color Scheme
- **Background**: Dark charcoal (#161512)
- **Board Light Squares**: Cream (#f0d9b5)
- **Board Dark Squares**: Brown (#b58863)
- **Primary Accent**: Green (#81b64c)
- **Success**: Emerald green (#10b981)
- **Error**: Red (#ef4444)

### Animations
- Page load sequence with staggered elements
- Move execution with scale and rotation
- Check alert with pulsing king piece
- Capture particle explosion effect
- Toast notifications slide in from right
- Modal scale and fade transitions

### Responsive Design
- Fully responsive layout
- Board scales on different screen sizes
- Mobile-optimized controls
- Hidden text labels on small screens
- Touch-friendly buttons

---

## 🔧 Development Features

### Server-Side Architecture
- **Game State Management** - Each game instance tracks players, board state, and history
- **Event-Driven** - Socket.io events for all game actions
- **Room Broadcasting** - Updates sent only to players in the same game
- **Player Management** - Handles disconnections and reconnections
- **Move History** - Complete game history stored on server

### Client-Side Architecture
- **Class-Based Design** - Clean, maintainable code structure
- **Event Listeners** - Modular event handling
- **Animation System** - GSAP-powered smooth animations
- **Toast System** - Reusable notification component
- **Modal Manager** - Dynamic modal content

### Code Quality
- Clear, commented code
- Consistent naming conventions
- Modular function design
- Error handling throughout
- Console logging for debugging

---

## 🐛 Known Limitations

- History navigation buttons are UI-ready but not fully functional
- No persistent database (games reset on server restart)
- No chess clock/time controls implemented
- No undo move feature (button present but not functional)
- Limited to two players per game (no multi-game support per user)

---

## 🔮 Future Enhancements (Potential)

- Add chess clock with time controls
- Implement move history replay
- Add user accounts and game history database
- ELO rating system with ranking
- Chat functionality between players
- AI opponent for single-player
- Multiple board themes and piece sets
- Sound effects for moves
- 3D chess board option
- Tournament mode

---

## 📝 Game Rules Implemented

✅ All standard chess rules  
✅ Castling (kingside and queenside)  
✅ En passant  
✅ Pawn promotion (auto-promotes to Queen)  
✅ Check detection  
✅ Checkmate detection  
✅ Stalemate detection  
✅ Draw by insufficient material  
✅ Draw by agreement  
✅ Resignation  

---

## 🤝 Contributing

This is a personal learning project, but suggestions and feedback are welcome! Feel free to:
- Report bugs
- Suggest features
- Share improvements
- Fork and experiment

---

## 📄 License

MIT License - Feel free to use this code for learning purposes.

---

## 👤 Author

**Anshu Raj**
- GitHub: [@anshu-c8NETed](https://github.com/anshu-c8NETed)
- LinkedIn: [anshu-raj-tech](https://www.linkedin.com/in/anshu-raj-tech/)
- LeetCode: [anshxu](https://leetcode.com/u/anshxu/)

---

## 🎯 Project Stats

- **Code Lines**: ~2000+
- **Files**: 6 main files
- **Technologies**: 8+
- **Features**: 25+
- **Animations**: 15+
- **Socket Events**: 12+

---

Made with ♟️ and ☕ by Anshu Raj
