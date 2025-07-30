# Multiplayer TicTacToe with Persistence Mechanics

A modern, customizable TicTacToe game with multiplayer support using WebRTC peer-to-peer connections. Players can host games, join via game IDs, or play locally.

## 🎮 Features

### Core Gameplay
- **Customizable Board Sizes**: 3x3 to 8x8 grids
- **Symbol Persistence**: Configurable limit on how many symbols each player can have on the board
- **Scoring System**: Points for consecutive symbols (3=1pt, 4=4pts, 5+=7pts)
- **Visual Fading**: Older symbols fade and eventually disappear
- **Real-time Scoring**: Immediate feedback on scoring moves

### Multiplayer Features
- **Peer-to-Peer**: Direct connections using WebRTC (no server required)
- **Host Games**: Create a game and share your ID with friends
- **Join Games**: Enter a friend's game ID to join their game
- **Local Play**: Single-player mode for practice
- **Real-time Sync**: Moves are synchronized between players instantly

## 🚀 How to Play

### Multiplayer Setup
1. **Host a Game**:
   - Click "Host Game"
   - Copy your Game ID and share it with a friend
   - Wait for them to join

2. **Join a Game**:
   - Click "Join Game"
   - Enter the Game ID from your friend
   - Click "Join" to connect

3. **Local Play**:
   - Click "Play Local" for single-player mode

### Game Rules
- **Turns**: Players alternate placing symbols (O and X)
- **Scoring**: Get points for consecutive symbols in rows, columns, or diagonals
- **Persistence**: Only the newest symbols stay on the board (older ones fade and disappear)
- **Strategy**: Plan ahead as your older symbols will be removed when you place new ones!

## 🛠️ Technical Details

### Technologies Used
- **HTML5/CSS3**: Modern responsive design
- **JavaScript ES6+**: Game logic and multiplayer functionality
- **Tailwind CSS**: Utility-first CSS framework for styling
- **PeerJS**: WebRTC library for peer-to-peer connections
- **WebRTC**: Direct browser-to-browser communication

### Architecture
- **Client-Side Only**: No server required for multiplayer
- **Peer-to-Peer**: Direct connections between players
- **Real-time**: Instant move synchronization
- **Responsive**: Works on desktop and mobile devices

## 📱 Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

**Note**: WebRTC requires HTTPS in production, but works on localhost for development.

## 🎯 Game Modes

### Multiplayer Mode
- Host creates a game and gets a unique ID
- Guest joins using the host's ID
- Real-time synchronization of moves
- Both players see the same board state

### Local Mode
- Single-player practice mode
- Same game mechanics as multiplayer
- Perfect for learning the game

## 🔧 Customization

### Board Size
Choose from 3x3 to 8x8 grids:
- 3x3: Classic TicTacToe
- 4x4-6x6: Medium complexity
- 7x7-8x8: High complexity with strategic depth

### Symbol Persistence
Control how many symbols each player can have:
- 3-10: Quick games with limited symbols
- 15-30: Medium-length games
- 40-50: Long strategic games
- Unlimited: No symbol limit

## 🚀 Deployment

This game is designed to work on GitHub Pages or any static hosting service:

1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Share the GitHub Pages URL with friends

## 🎨 UI Features

- **Modern Design**: Clean, responsive interface
- **Visual Feedback**: Scoring animations and cell highlighting
- **Connection Status**: Real-time multiplayer connection indicators
- **Mobile Friendly**: Responsive design for all screen sizes

## 🔮 Future Enhancements

- Game history and statistics
- Custom themes and colors
- Tournament mode
- AI opponent for local play
- Chat functionality
- Spectator mode

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy playing!** 🎮 