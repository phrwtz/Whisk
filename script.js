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

        // Restore any previously flashed cells and clear scoring message
        if (this.winningCellsToRestore) {
            this.winningCellsToRestore.cells.forEach((cell, index) => {
                cell.style.backgroundColor = this.winningCellsToRestore.colors[index];
                cell.style.setProperty('background-color', this.winningCellsToRestore.colors[index], 'important');
            });
            this.winningCellsToRestore = null;
        }
        
        // Clear any previous scoring message
        const gameStatus = document.getElementById('gameStatus');
        if (gameStatus) {
            gameStatus.textContent = '';
            console.log('Cleared gameStatus text');
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
        const scoringResult = this.checkScoring(row, col);
        const pointsEarned = scoringResult.totalPoints;
        const scoringCells = scoringResult.scoringCells;
        
        console.log(`Player ${this.currentPlayer} at (${row}, ${col}) earned ${pointsEarned} points`);
        if (pointsEarned > 0) {
            console.log(`Player ${this.currentPlayer} scored ${pointsEarned} points on this move!`);
            this.scores[this.currentPlayer] += pointsEarned;
            console.log(`Updated scores: O=${this.scores.O}, X=${this.scores.X}`);
            this.updateScoreDisplay();
            this.showScoringMessage(pointsEarned, this.currentPlayer);
            
            // Flash the scoring cells
            if (scoringCells.length > 0) {
                const cellElements = scoringCells.map(cell => 
                    document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`)
                ).filter(cell => cell !== null);
                this.flashWinningCells(cellElements);
            }
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
        let scoringCells = [];
        
        // Check horizontal
        const horizontalResult = this.checkLineForScoring(row, 0, 0, 1, player);
        if (horizontalResult.points > 0) {
            totalPoints += horizontalResult.points;
            scoringCells = scoringCells.concat(horizontalResult.winningCells);
        }
        
        // Check vertical
        const verticalResult = this.checkLineForScoring(0, col, 1, 0, player);
        if (verticalResult.points > 0) {
            totalPoints += verticalResult.points;
            scoringCells = scoringCells.concat(verticalResult.winningCells);
        }
        
        // Check diagonal (top-left to bottom-right) - only check the diagonal that passes through the clicked cell
        const diagonal1Result = this.checkDiagonalThroughCell(row, col, 1, 1, player);
        if (diagonal1Result.points > 0) {
            totalPoints += diagonal1Result.points;
            scoringCells = scoringCells.concat(diagonal1Result.winningCells);
        }
        
        // Check diagonal (top-right to bottom-left) - only check the diagonal that passes through the clicked cell
        const diagonal2Result = this.checkDiagonalThroughCell(row, col, 1, -1, player);
        if (diagonal2Result.points > 0) {
            totalPoints += diagonal2Result.points;
            scoringCells = scoringCells.concat(diagonal2Result.winningCells);
        }
        
        return { totalPoints, scoringCells };
    }

    checkLineForScoring(startRow, startCol, deltaRow, deltaCol, player) {
        let maxCount = 0;
        let winningCells = [];
        
        // Check the entire line for the longest consecutive sequence
        for (let start = 0; start < this.boardSize; start++) {
            let count = 0;
            let currentCells = [];
            
            for (let i = 0; i < this.boardSize; i++) {
                const row = startRow + (start + i) * deltaRow;
                const col = startCol + (start + i) * deltaCol;
                
                if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
                    if (this.board[row][col] === player) {
                        count++;
                        currentCells.push({row, col});
                        if (count > maxCount) {
                            maxCount = count;
                            winningCells = [...currentCells];
                        }
                    } else {
                        count = 0;
                        currentCells = [];
                    }
                }
            }
        }
        
        // Award points based on the longest consecutive line
        let points = 0;
        if (maxCount >= 5) points = 7;
        else if (maxCount === 4) points = 4;
        else if (maxCount === 3) points = 1;
        
        return { points, winningCells };
    }

    checkDiagonalThroughCell(row, col, deltaRow, deltaCol, player) {
        console.log(`Checking diagonal through cell (${row}, ${col}) with delta (${deltaRow}, ${deltaCol}) for player ${player}`);
        
        let maxCount = 0;
        let winningCells = [];
        
        // Find the start of the diagonal that passes through the clicked cell
        let startRow = row;
        let startCol = col;
        
        // Move backwards to find the start of the diagonal
        while (startRow >= 0 && startCol >= 0 && startRow < this.boardSize && startCol < this.boardSize) {
            startRow -= deltaRow;
            startCol -= deltaCol;
        }
        startRow += deltaRow;
        startCol += deltaCol;
        
        console.log(`Diagonal starts at (${startRow}, ${startCol})`);
        
        // Check the diagonal from start to end
        let count = 0;
        let currentCells = [];
        
        for (let i = 0; i < this.boardSize; i++) {
            const currentRow = startRow + i * deltaRow;
            const currentCol = startCol + i * deltaCol;
            
            if (currentRow >= 0 && currentRow < this.boardSize && currentCol >= 0 && currentCol < this.boardSize) {
                console.log(`Checking cell (${currentRow}, ${currentCol}): ${this.board[currentRow][currentCol]}`);
                
                if (this.board[currentRow][currentCol] === player) {
                    count++;
                    currentCells.push({row: currentRow, col: currentCol});
                    if (count > maxCount) {
                        maxCount = count;
                        winningCells = [...currentCells];
                    }
                } else {
                    count = 0;
                    currentCells = [];
                }
            }
        }
        
        console.log(`Diagonal result: maxCount = ${maxCount}, winningCells =`, winningCells);
        
        // Award points based on the consecutive line
        let points = 0;
        if (maxCount >= 5) points = 7;
        else if (maxCount === 4) points = 4;
        else if (maxCount === 3) points = 1;
        
        return { points, winningCells };
    }



    updateGameDisplay() {
        document.getElementById('playerSymbol').textContent = this.currentPlayer;
        // Don't clear the scoring message here - let it stay until next move
        // Only update the score display, don't touch the gameStatus
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        document.getElementById('scoreO').textContent = this.scores.O;
        document.getElementById('scoreX').textContent = this.scores.X;
    }

    showScoringMessage(points, player) {
        const gameStatus = document.getElementById('gameStatus');
        console.log('showScoringMessage called with:', points, player);
        console.log('gameStatus element:', gameStatus);
        
        if (gameStatus) {
            let message;
            let textColor = '#48bb78';
            
            // Check if this player has won (100+ points)
            if (this.scores[player] >= 100) {
                message = `${player} wins!`;
                textColor = '#e53e3e'; // Red color for win message
            } else {
                message = points === 1 ? `${player} scores 1 point!` : `${player} scores ${points} points!`;
            }
            
            gameStatus.textContent = message;
            gameStatus.style.color = textColor;
            gameStatus.style.backgroundColor = '#f0f0f0'; // Add background to make it visible
            gameStatus.style.padding = '10px';
            gameStatus.style.borderRadius = '5px';
            gameStatus.style.fontSize = '1.2rem';
            gameStatus.style.fontWeight = 'bold';
            gameStatus.style.border = `2px solid ${textColor}`;
            gameStatus.style.display = 'block'; // Ensure it's visible
            gameStatus.style.visibility = 'visible'; // Ensure it's visible
            console.log('Set gameStatus text to:', message);
            console.log('gameStatus element after setting:', gameStatus);
            console.log('gameStatus parent element:', gameStatus.parentElement);
        } else {
            console.error('gameStatus element not found!');
        }
        
        // Keep the message until next turn (don't auto-clear)
    }

    flashWinningCells(winningCells) {
        // Store original colors
        const originalColors = [];
        winningCells.forEach(cell => {
            originalColors.push(cell.style.backgroundColor);
        });
        
        // Set to yellow and keep until next move
        winningCells.forEach(cell => {
            cell.style.backgroundColor = 'yellow';
            cell.style.setProperty('background-color', 'yellow', 'important');
        });
        
        // Store the original colors to restore later
        this.winningCellsToRestore = { cells: winningCells, colors: originalColors };
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