class TicTacToe {
    constructor() {
        this.boardSize = 3;
        this.persistence = 3;
        this.board = [];
        this.currentPlayer = 'O';
        this.gameActive = false;
        this.winningCells = [];
        this.symbolHistory = []; // Track symbols in order of placement
        this.symbolCounts = { O: 0, X: 0 };
        this.scores = { O: 0, X: 0 };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Setup event listeners
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('newGame').addEventListener('click', () => this.newGame());
        document.getElementById('resetSetup').addEventListener('click', () => this.showSetup());
    }



    startGame() {
        this.boardSize = parseInt(document.getElementById('boardSize').value);
        this.persistence = parseInt(document.getElementById('persistence').value);
        
        // Validate persistence
        const maxPossibleSymbols = this.boardSize * this.boardSize;
        if (this.persistence > maxPossibleSymbols) {
            alert(`Persistence cannot be greater than the total board size (${maxPossibleSymbols})!`);
            return;
        }
        
        this.initializeBoard();
        this.gameActive = true;
        this.currentPlayer = 'O';
        this.symbolHistory = [];
        this.symbolCounts = { O: 0, X: 0 };
        this.scores = { O: 0, X: 0 };
        
        // Show game interface
        document.getElementById('setup').style.display = 'none';
        document.getElementById('game').style.display = 'block';
        
        this.updateGameDisplay();
        this.createBoard();
    }

    initializeBoard() {
        this.board = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = '';
            }
        }
        this.winningCells = [];
    }

    createBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        
        // Add board size class for styling
        gameBoard.className = 'game-board';
        if (this.boardSize === 3) {
            gameBoard.classList.add('board-3x3');
        }
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('button');
                cell.className = 'cell';
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => this.handleCellClick(i, j));
                gameBoard.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        if (!this.gameActive || this.board[row][col] !== '') {
            return;
        }

        // Place the symbol
        this.board[row][col] = this.currentPlayer;
        this.symbolCounts[this.currentPlayer]++;
        
        // Add to history with position info
        this.symbolHistory.push({
            symbol: this.currentPlayer,
            row: row,
            col: col,
            timestamp: Date.now()
        });

        // Check if we need to remove oldest symbols
        this.managePersistence();

        this.updateCellDisplay(row, col);
        this.updateAllFadingEffects();

        // Check for scoring opportunities
        const pointsEarned = this.checkScoring(row, col);
        console.log(`Player ${this.currentPlayer} at (${row}, ${col}) earned ${pointsEarned} points`);
        if (pointsEarned > 0) {
            this.scores[this.currentPlayer] += pointsEarned;
            console.log(`Updated scores: O=${this.scores.O}, X=${this.scores.X}`);
            this.updateScoreDisplay();
            this.showScoringMessage(pointsEarned);
        }

        // Switch players
        this.currentPlayer = this.currentPlayer === 'O' ? 'X' : 'O';
        this.updateGameDisplay();
    }

    managePersistence() {
        const currentPlayerCount = this.symbolCounts[this.currentPlayer];
        
        if (this.persistence === 64) return; // Unlimited mode
        
        if (currentPlayerCount > this.persistence) {
            // Find and remove the oldest symbol of the current player
            let oldestSymbolIndex = -1;
            for (let i = 0; i < this.symbolHistory.length; i++) {
                if (this.symbolHistory[i].symbol === this.currentPlayer) {
                    oldestSymbolIndex = i;
                    break;
                }
            }
            
            if (oldestSymbolIndex !== -1) {
                const oldestSymbol = this.symbolHistory.splice(oldestSymbolIndex, 1)[0];
                this.board[oldestSymbol.row][oldestSymbol.col] = '';
                this.symbolCounts[this.currentPlayer]--;
                
                // Clear the cell display
                const cell = document.querySelector(`[data-row="${oldestSymbol.row}"][data-col="${oldestSymbol.col}"]`);
                if (cell) {
                    cell.textContent = '';
                    cell.className = 'cell';
                    // Remove any fade classes that might be left
                    cell.className = cell.className.replace(/fade-\d+/g, '');
                }
            }
        }
    }

    setCellFillColor(row, col, symbolAge) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        if (symbolAge === 0) {
            // Empty cell - set to white
            cell.style.backgroundColor = 'white';
            cell.style.setProperty('background-color', 'white', 'important');
            console.log(`Cell (${row}, ${col}) - empty: background = white`);
        } else {
            // Calculate HSL color based on age
            const hue = 120; // Green hue
            const saturation = Math.max(0, 100 - (symbolAge - 1) * 10); // Decrease saturation linearly
            const lightness = 85; // Keep lightness constant for good visibility
            
            const hslColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            cell.style.backgroundColor = hslColor;
            cell.style.setProperty('background-color', hslColor, 'important');
            
            console.log(`Cell (${row}, ${col}) - age ${symbolAge}: background = ${hslColor}`);
        }
    }

    updateAllFadingEffects() {
        if (this.persistence === 64) return; // No fading in unlimited mode
        
        // Clear all fading classes first, but preserve background colors
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            // Remove only fade classes, preserve other classes
            cell.className = cell.className.replace(/fade-\d+/g, '');
            // Don't clear background color here - let it be set by the fade classes
        });

        // Apply fading effects based on symbol age per player
        const playerSymbols = { O: [], X: [] };
        
        // Group symbols by player
        this.symbolHistory.forEach((symbolData, index) => {
            if (playerSymbols[symbolData.symbol]) {
                playerSymbols[symbolData.symbol].push({ ...symbolData, originalIndex: index });
            }
        });
        
        // Apply fading effects for each player's symbols
        ['O', 'X'].forEach(player => {
            const playerSymbolCount = playerSymbols[player].length;
            
            // Sort symbols by timestamp to get correct age order
            const sortedSymbols = playerSymbols[player].sort((a, b) => a.timestamp - b.timestamp);
            
            sortedSymbols.forEach((symbolData, sortedIndex) => {
                const cell = document.querySelector(`[data-row="${symbolData.row}"][data-col="${symbolData.col}"]`);
                if (cell && cell.textContent === symbolData.symbol) {
                    // Calculate fade level: newest symbol (last in sorted array) gets fade-0 (darkest)
                    // Oldest symbol (first in sorted array) gets highest fade (lightest)
                    const ageFromNewest = sortedSymbols.length - 1 - sortedIndex;
                    const fadeLevel = Math.min(ageFromNewest, 10); // Max 10 fade levels
                    cell.classList.add(`fade-${fadeLevel}`);
                    
                    // Also apply inline styles as backup
                    // Calculate the square size as board size divided by number of rows/columns
                    const gameBoard = document.getElementById('gameBoard');
                    const boardWidth = parseFloat(window.getComputedStyle(gameBoard).width);
                    const squareSize = boardWidth / this.boardSize; // Size of each square
                    const baseFontSize = squareSize * 0.99; // 99% of square size as base font size
                    
                    // Calculate fade sizes as percentages of the square size
                    // Newest: 99% of square size, Oldest: 25% of square size
                    const fadePercentages = [0.99, 0.89, 0.79, 0.69, 0.59, 0.49, 0.39, 0.34, 0.29, 0.265, 0.25];
                    const fadeSizes = fadePercentages.map(p => baseFontSize * p);
                    
                    cell.style.fontSize = `${fadeSizes[fadeLevel]}px`;
                    cell.style.fontWeight = Math.max(100, 900 - fadeLevel * 80);
                    
                    // Use the new function to set fill color based on age
                    const symbolAge = fadeLevel + 1; // Age 1 for newest, age 11 for oldest
                    this.setCellFillColor(symbolData.row, symbolData.col, symbolAge);
                }
            });
        });
        
        // Set all empty cells to white
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!this.board[row][col]) {
                    this.setCellFillColor(row, col, 0);
                }
            }
        }
        
        // Log all filled cells and their background colors after fading update
        console.log('=== ALL FILLED CELLS AFTER FADING UPDATE ===');
        this.symbolHistory.forEach((symbolData, index) => {
            const cell = document.querySelector(`[data-row="${symbolData.row}"][data-col="${symbolData.col}"]`);
            if (cell && cell.textContent === symbolData.symbol) {
                console.log(`Cell (${symbolData.row}, ${symbolData.col}) with symbol '${symbolData.symbol}': background = ${cell.style.backgroundColor}`);
            }
        });
        console.log('=== END FILLED CELLS LOG ===');
    }

    updateCellDisplay(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = this.board[row][col];
        
        // Remove existing player classes and add the new one
        cell.classList.remove('o', 'x');
        if (this.board[row][col]) {
        cell.classList.add(this.board[row][col].toLowerCase());
        }
        
        // Log the initial cell state
        console.log(`Cell (${row}, ${col}) updated with symbol: ${this.board[row][col]}`);
        console.log(`Cell background after update:`, cell.style.backgroundColor);
        
        // Don't clear any existing styles - let updateAllFadingEffects handle the background
        // But ensure we don't clear the background color that was just set
    }

    checkScoring(row, col) {
        const player = this.board[row][col];
        let totalPoints = 0;
        
        // Check horizontal
        totalPoints += this.checkLineForScoring(row, 0, 0, 1, player);
        
        // Check vertical
        totalPoints += this.checkLineForScoring(0, col, 1, 0, player);
        
        // Check diagonal (top-left to bottom-right)
        totalPoints += this.checkLineForScoring(0, 0, 1, 1, player);
        
        // Check diagonal (top-right to bottom-left)
        totalPoints += this.checkLineForScoring(0, this.boardSize - 1, 1, -1, player);
        
        return totalPoints;
    }

    checkLineForScoring(startRow, startCol, deltaRow, deltaCol, player) {
        let maxCount = 0;
        
        // Check the entire line for the longest consecutive sequence
        for (let start = 0; start < this.boardSize; start++) {
            let count = 0;
            for (let i = 0; i < this.boardSize; i++) {
                const row = startRow + (start + i) * deltaRow;
                const col = startCol + (start + i) * deltaCol;
                
                if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
                    if (this.board[row][col] === player) {
                        count++;
                        maxCount = Math.max(maxCount, count);
                    } else {
                        count = 0;
                    }
                }
            }
        }
        
        // Award points based on the longest consecutive line
        if (maxCount >= 5) return 7;
        if (maxCount === 4) return 4;
        if (maxCount === 3) return 1;
        return 0;
    }



    updateGameDisplay() {
        document.getElementById('playerSymbol').textContent = this.currentPlayer;
        document.getElementById('gameStatus').textContent = '';
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        document.getElementById('scoreO').textContent = this.scores.O;
        document.getElementById('scoreX').textContent = this.scores.X;
    }

    showScoringMessage(points) {
        const messages = {
            1: `${this.currentPlayer} scored 1 point for 3 in a row!`,
            4: `${this.currentPlayer} scored 4 points for 4 in a row!`,
            7: `${this.currentPlayer} scored 7 points for 5+ in a row!`
        };
        
        const message = messages[points] || `${this.currentPlayer} scored ${points} points!`;
        document.getElementById('gameStatus').textContent = message;
        
        // Clear message after 3 seconds
        setTimeout(() => {
            document.getElementById('gameStatus').textContent = '';
        }, 3000);
    }

    newGame() {
        this.initializeBoard();
        this.gameActive = true;
        this.currentPlayer = 'O';
        this.winningCells = [];
        this.symbolHistory = [];
        this.symbolCounts = { O: 0, X: 0 };
        this.scores = { O: 0, X: 0 };
        
        // Clear all cells completely
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
            // Clear all inline styles including background color
            cell.style.fontSize = '';
            cell.style.opacity = '';
            cell.style.fontWeight = '';
            cell.style.backgroundColor = '';
        });
        
        this.updateGameDisplay();
    }

    showSetup() {
        document.getElementById('game').style.display = 'none';
        document.getElementById('setup').style.display = 'block';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
}); 