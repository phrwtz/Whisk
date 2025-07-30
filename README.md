# Customizable Tic Tac Toe Game

A modern, interactive tic tac toe game with customizable board size, win conditions, and symbol persistence.

## Features

- **Customizable Board Size**: Choose from 3x3 to 8x8 boards
- **Flexible Win Conditions**: Set the number of symbols needed in a row to win (3-8)
- **Symbol Persistence**: Limit the maximum number of symbols allowed on the board
- **Visual Fading Effect**: Symbols gradually fade as new ones are placed, with the oldest symbols becoming very faint
- **Two-Player Game**: Players take turns placing O's and X's
- **Modern UI**: Beautiful, responsive design with smooth animations using Tailwind CSS
- **Win Detection**: Automatically detects wins in all directions (horizontal, vertical, diagonal)
- **Visual Feedback**: Winning combinations are highlighted with animation

## How to Play

1. **Setup**: 
   - Choose your desired board size (3x3 to 8x8)
   - Select the number of symbols needed in a row to win (3-8)
   - Set the persistence (maximum number of symbols allowed on the board)
   - Click "Start Game"

2. **Gameplay**:
   - Player O goes first, followed by Player X
   - Click on any empty cell to place your symbol
   - When the persistence limit is reached, the oldest symbol disappears
   - Symbols gradually fade from bold and opaque to thin and transparent
   - The game automatically detects wins and draws
   - Winning combinations are highlighted in green

3. **Controls**:
   - "New Game": Start a new game with the same settings
   - "Change Settings": Return to the setup screen to modify board size, win conditions, or persistence

## Game Rules

- Players alternate turns placing their symbols (O and X)
- Win by getting the required number of symbols in a row (horizontal, vertical, or diagonal)
- **Persistence**: When the maximum number of symbols is reached, the oldest symbol is automatically removed
- **Fading Effect**: Symbols become progressively more transparent and thinner based on their age
- If all cells are filled without a winner, the game is a draw
- Win condition cannot exceed the board size
- Persistence cannot exceed the total board size

## Persistence Feature

The persistence feature adds a strategic element to the game:

- **Limited Symbols**: Set a maximum number of symbols (3-50) or choose "Unlimited"
- **Automatic Removal**: When the limit is reached, the oldest symbol disappears
- **Visual Feedback**: Symbols fade gradually, making it easy to see which will disappear next
- **Strategic Play**: Players must think about symbol placement and timing

## Fading Effect

The visual fading system provides clear feedback:

- **Newest Symbols**: Bold, fully opaque (100% opacity, 900 font-weight)
- **Older Symbols**: Gradually become thinner and more transparent
- **Oldest Symbols**: Very faint (5% opacity, 100 font-weight)
- **Next to Disappear**: The faintest symbol will be removed on the next move

## Technical Details

- Built with vanilla HTML, JavaScript, and Tailwind CSS
- Responsive design that works on desktop and mobile devices
- Uses Tailwind CSS CDN for styling (no build process required)
- Modern CSS Grid for dynamic board layout
- Smooth animations and hover effects
- Advanced symbol tracking and management system

## File Structure

```
├── index.html          # Main HTML structure with Tailwind CSS
├── script.js           # Game logic and functionality
├── test-tailwind.html  # Test file to verify Tailwind CSS
└── README.md           # This file
```

## Getting Started

1. Open `index.html` in any modern web browser
2. Configure your desired board size, win condition, and persistence
3. Click "Start Game" to begin playing
4. Watch as symbols fade and disappear when the limit is reached
5. Enjoy!

## Browser Compatibility

This game works in all modern browsers that support:
- CSS Grid
- ES6 Classes
- Tailwind CSS
- Flexbox
- CSS Transitions and Animations

Tested on Chrome, Firefox, Safari, and Edge.

## Tailwind CSS

This project uses Tailwind CSS for styling, which provides:
- Utility-first CSS framework
- Responsive design out of the box
- Consistent spacing and typography
- Modern design patterns
- No custom CSS required 