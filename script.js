class TicTacToe {
    constructor() {
        this.boardSize = 3;
        this.winCondition = 3;
        this.persistence = 3;
        this.board = [];
        this.currentPlayer = 'O';
        this.gameActive = false;
        this.winningCells = [];
        this.symbolHistory = []; // Track symbols in order of placement
        this.symbolCounts = { O: 0, X: 0 };
        
        this.initializeEventListeners();
        this.updateWinConditionOptions();
    }

    initializeEventListeners() {
        // Setup event listeners
        document.getElementById('startGame').addEventListener('click', () => this.startGame());
        document.getElementById('newGame').addEventListener('click', () => this.newGame());
        document.getElementById('resetSetup').addEventListener('click', () => this.showSetup());
        
        // Update win condition options when board size changes
        document.getElementById('boardSize').addEventListener('change', () => this.updateWinConditionOptions());
    }

    updateWinConditionOptions() {
        const boardSize = parseInt(document.getElementById('boardSize').value);
        const winConditionSelect = document.getElementById('winCondition');
        
        // Clear existing options
        winConditionSelect.innerHTML = '';
        
        // Add options from 3 to board size
        for (let i = 3; i <= boardSize; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            winConditionSelect.appendChild(option);
        }
        
        // Set default to 3 or board size if board size is less than 3
        winConditionSelect.value = Math.min(3, boardSize);
    }

    startGame() {
        this.boardSize = parseInt(document.getElementById('boardSize').value);
        this.winCondition = parseInt(document.getElementById('winCondition').value);
        this.persistence = parseInt(document.getElementById('persistence').value);
        
        // Validate win condition
        if (this.winCondition > this.boardSize) {
            alert('Win condition cannot be greater than board size!');
            return;
        }
        
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

        if (this.checkWin(row, col)) {
            this.endGame(`${this.currentPlayer} wins!`);
            this.highlightWinningCells();
        } else if (this.checkDraw()) {
            this.endGame("It's a draw!");
        } else {
            this.currentPlayer = this.currentPlayer === 'O' ? 'X' : 'O';
            this.updateGameDisplay();
        }
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

    updateAllFadingEffects() {
        if (this.persistence === 64) return; // No fading in unlimited mode
        
        // Clear all fading classes first
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            // Remove only fade classes, preserve other classes
            cell.className = cell.className.replace(/fade-\d+/g, '');
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
                    // Calculate fade level: oldest symbol (first in sorted array) gets highest fade
                    // Newest symbol (last in sorted array) gets fade-0
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
                    // Newest: fully opaque, Oldest: very faint
                    const fadeOpacities = [1, 0.85, 0.7, 0.55, 0.4, 0.25, 0.15, 0.1, 0.06, 0.03, 0.01];
                    
                    cell.style.fontSize = `${fadeSizes[fadeLevel]}px`;
                    cell.style.opacity = fadeOpacities[fadeLevel];
                    cell.style.fontWeight = Math.max(100, 900 - fadeLevel * 80);

                }
            });
        });
    }

    updateCellDisplay(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.textContent = this.board[row][col];
        
        // Remove existing player classes and add the new one
        cell.classList.remove('o', 'x');
        if (this.board[row][col]) {
        cell.classList.add(this.board[row][col].toLowerCase());
        }
        
        // Preserve any existing inline styles (for fade effects)
        // The fade effects will be reapplied in updateAllFadingEffects
    }

    checkWin(row, col) {
        const player = this.board[row][col];
        
        // Check horizontal
        if (this.checkLine(row, 0, 0, 1, player)) return true;
        
        // Check vertical
        if (this.checkLine(0, col, 1, 0, player)) return true;
        
        // Check diagonal (top-left to bottom-right)
        if (row === col && this.checkLine(0, 0, 1, 1, player)) return true;
        
        // Check diagonal (top-right to bottom-left)
        if (row + col === this.boardSize - 1 && this.checkLine(0, this.boardSize - 1, 1, -1, player)) return true;
        
        return false;
    }

    checkLine(startRow, startCol, deltaRow, deltaCol, player) {
        let count = 0;
        let cells = [];
        
        for (let i = 0; i < this.boardSize; i++) {
            const row = startRow + i * deltaRow;
            const col = startCol + i * deltaCol;
            
            if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
                if (this.board[row][col] === player) {
                    count++;
                    cells.push({row, col});
                } else {
                    count = 0;
                    cells = [];
                }
                
                if (count >= this.winCondition) {
                    this.winningCells = cells.slice(-this.winCondition);
                    return true;
                }
            }
        }
        
        return false;
    }

    checkDraw() {
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === '') {
                    return false;
                }
            }
        }
        return true;
    }

    highlightWinningCells() {
        this.winningCells.forEach(({row, col}) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('winning');
        });
    }

    endGame(message) {
        this.gameActive = false;
        document.getElementById('gameStatus').textContent = message;
    }

    updateGameDisplay() {
        document.getElementById('playerSymbol').textContent = this.currentPlayer;
        document.getElementById('gameStatus').textContent = '';
    }

    newGame() {
        this.initializeBoard();
        this.gameActive = true;
        this.currentPlayer = 'O';
        this.winningCells = [];
        this.symbolHistory = [];
        this.symbolCounts = { O: 0, X: 0 };
        
        // Clear all cells completely
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
            // Clear all inline styles
            cell.style.fontSize = '';
            cell.style.opacity = '';
            cell.style.fontWeight = '';
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