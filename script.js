console.log("Whisk: script.js loaded and running (latest version) -", new Date().toISOString());
// Core Game Logic - Pure game state and rules
class GameLogic {
    constructor(boardSize = 8, persistence = 5) {
        this.boardSize = boardSize;
        this.persistence = persistence;
        console.log('GameLogic created with persistence:', this.persistence, 'boardSize:', this.boardSize);
        this.reset();
    }

    reset() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(''));
        this.currentPlayer = 'O';
        this.gameActive = false;
        this.winningCells = [];
        this.symbolHistory = [];
        this.symbolCounts = { O: 0, X: 0 };
        this.scores = { O: 0, X: 0 };
        this.currentScoringCells = []; // Track cells involved in current scoring
    }

    makeMove(row, col, player) {
        if (!this.gameActive || this.board[row][col] !== '') {
            return { success: false, message: 'Invalid move' };
        }

        // Add the move to the board
        this.board[row][col] = player;
        
        // Add to history for persistence management
        this.symbolHistory.push({
            symbol: player,
            row: row,
            col: col,
            timestamp: Date.now()
        });

        // Manage persistence BEFORE scoring (so scoring uses correct board state)
        this.managePersistence();

        // Check for scoring using the updated board state
        const scoringResult = this.checkScoring(row, col);
        if (scoringResult.totalPoints > 0) {
            this.scores[player] += scoringResult.totalPoints;
            // Store the scoring cells for highlighting only when there's scoring
            this.currentScoringCells = scoringResult.scoringCells;
        } else {
            // Clear scoring cells when there's no scoring
            this.currentScoringCells = [];
        }

        // Switch players
        this.currentPlayer = this.currentPlayer === 'O' ? 'X' : 'O';

        return {
            success: true,
            scoringResult,
            currentPlayer: this.currentPlayer
        };
    }

    checkScoring(row, col) {
        const player = this.board[row][col];
        if (!player) return { totalPoints: 0, scoringCells: [] };

        let totalPoints = 0;
        let scoringCells = [];

        // Check vertical line (up and down from placed symbol)
        const verticalResult = this.checkVerticalLine(row, col, player);
        totalPoints += verticalResult.points;
        if (verticalResult.points > 0) {
            scoringCells.push(...verticalResult.cells);
        }

        // Check horizontal line (left and right from placed symbol)
        const horizontalResult = this.checkHorizontalLine(row, col, player);
        totalPoints += horizontalResult.points;
        if (horizontalResult.points > 0) {
            scoringCells.push(...horizontalResult.cells);
        }

        // Check diagonal lines (up-right and down-left, up-left and down-right)
        const diagonalResults = this.checkDiagonalLines(row, col, player);
        totalPoints += diagonalResults.points;
        if (diagonalResults.points > 0) {
            scoringCells.push(...diagonalResults.cells);
        }

        // Add the newly placed symbol to highlighting if there's scoring
        if (totalPoints > 0) {
            scoringCells.push({ row: row, col: col });
        }

        return { totalPoints, scoringCells };
    }

    checkVerticalLine(row, col, player) {
        let cells = [];
        
        // Count upward from placed symbol
        for (let r = row; r >= 0; r--) {
            if (this.board[r][col] === player) {
                cells.push({ row: r, col: col });
            } else {
                break;
            }
        }
        
        // Count downward from placed symbol (excluding the placed symbol itself)
        for (let r = row + 1; r < this.boardSize; r++) {
            if (this.board[r][col] === player) {
                cells.push({ row: r, col: col });
            } else {
                break;
            }
        }
        
        // Calculate points based on total line length (including the placed symbol)
        let totalLength = cells.length; // Already includes the placed symbol
        let points = 0;
        if (totalLength === 3) {
            points = 1;
        } else if (totalLength === 4) {
            points = 3;
        } else if (totalLength >= 5) {
            points = 5;
        }
        
        // Only include cells in highlighting if there's actual scoring
        if (totalLength < 3) {
            cells = []; // No highlighting if no scoring
        }
        
        return { points, cells };
    }

    checkHorizontalLine(row, col, player) {
        let cells = [];
        
        // Count leftward from placed symbol
        for (let c = col; c >= 0; c--) {
            if (this.board[row][c] === player) {
                cells.push({ row: row, col: c });
            } else {
                break;
            }
        }
        
        // Count rightward from placed symbol (excluding the placed symbol itself)
        for (let c = col + 1; c < this.boardSize; c++) {
            if (this.board[row][c] === player) {
                cells.push({ row: row, col: c });
            } else {
                break;
            }
        }
        
        // Calculate points based on total line length (including the placed symbol)
        let totalLength = cells.length; // Already includes the placed symbol
        let points = 0;
        if (totalLength === 3) {
            points = 1;
        } else if (totalLength === 4) {
            points = 3;
        } else if (totalLength >= 5) {
            points = 5;
        }
        
        // Only include cells in highlighting if there's actual scoring
        if (totalLength < 3) {
            cells = []; // No highlighting if no scoring
        }
        
        return { points, cells };
    }

    checkDiagonalLines(row, col, player) {
        let totalPoints = 0;
        let totalCells = [];
        
        // Check diagonal: up-right and down-left
        const diagonal1 = this.checkDiagonalDirection(row, col, player, -1, 1, 1, -1);
        totalPoints += diagonal1.points;
        if (diagonal1.points > 0) {
            totalCells.push(...diagonal1.cells);
        }
        
        // Check diagonal: up-left and down-right
        const diagonal2 = this.checkDiagonalDirection(row, col, player, -1, -1, 1, 1);
        totalPoints += diagonal2.points;
        if (diagonal2.points > 0) {
            totalCells.push(...diagonal2.cells);
        }
        
        return { points: totalPoints, cells: totalCells };
    }

    checkDiagonalDirection(row, col, player, upRowDelta, upColDelta, downRowDelta, downColDelta) {
        let cells = [];
        
        // Count in the up direction
        for (let r = row, c = col; r >= 0 && c >= 0 && r < this.boardSize && c < this.boardSize; r += upRowDelta, c += upColDelta) {
            if (this.board[r][c] === player) {
                cells.push({ row: r, col: c });
            } else {
                break;
            }
        }
        
        // Count in the down direction (excluding the placed symbol itself)
        for (let r = row + downRowDelta, c = col + downColDelta; r >= 0 && c >= 0 && r < this.boardSize && c < this.boardSize; r += downRowDelta, c += downColDelta) {
            if (this.board[r][c] === player) {
                cells.push({ row: r, col: c });
            } else {
                break;
            }
        }
        
        // Calculate points based on total line length (including the placed symbol)
        let totalLength = cells.length; // Already includes the placed symbol
        let points = 0;
        if (totalLength === 3) {
            points = 1;
        } else if (totalLength === 4) {
            points = 3;
        } else if (totalLength >= 5) {
            points = 5;
        }
        
        // Only include cells in highlighting if there's actual scoring
        if (totalLength < 3) {
            cells = []; // No highlighting if no scoring
        }
        
        return { points, cells };
    }

    managePersistence() {
        if (this.persistence === 64) return; // No persistence in unlimited mode

        console.log('Managing persistence - current length:', this.symbolHistory.length, 'persistence:', this.persistence);
        
        // Manage persistence per player
        const playerHistory = { O: [], X: [] };
        
        // Separate history by player
        this.symbolHistory.forEach(symbol => {
            playerHistory[symbol.symbol].push(symbol);
        });
        
        console.log('Player O symbols:', playerHistory.O.length, 'Player X symbols:', playerHistory.X.length);
        
        // Remove oldest symbols from board and history for each player if they exceed persistence limit
        Object.keys(playerHistory).forEach(player => {
            while (playerHistory[player].length > this.persistence) {
                const oldestSymbol = playerHistory[player].shift();
                this.board[oldestSymbol.row][oldestSymbol.col] = '';
                
                // Also remove from symbolHistory to keep it in sync
                const historyIndex = this.symbolHistory.findIndex(s => 
                    s.symbol === oldestSymbol.symbol && 
                    s.row === oldestSymbol.row && 
                    s.col === oldestSymbol.col
                );
                if (historyIndex !== -1) {
                    this.symbolHistory.splice(historyIndex, 1);
                }
                
                console.log('Removed symbol from board and history:', oldestSymbol.symbol, 'at', oldestSymbol.row, oldestSymbol.col);
            }
        });
        
        // Update symbol counts based on current board state
        this.updateSymbolCounts();
        
        console.log('After persistence management - O symbols:', playerHistory.O.length, 'X symbols:', playerHistory.X.length);
    }

    updateSymbolCounts() {
        // Reset counts
        this.symbolCounts = { O: 0, X: 0 };
        
        // Count symbols on the board
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const symbol = this.board[row][col];
                if (symbol === 'O' || symbol === 'X') {
                    this.symbolCounts[symbol]++;
                }
            }
        }
    }

    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            scores: this.scores,
            symbolHistory: this.symbolHistory,
            symbolCounts: this.symbolCounts,
            currentScoringCells: this.currentScoringCells,
            gameActive: this.gameActive
        };
    }

    setGameState(state) {
        this.board = state.board;
        this.currentPlayer = state.currentPlayer;
        this.scores = state.scores;
        this.symbolHistory = state.symbolHistory;
        this.symbolCounts = state.symbolCounts;
        this.currentScoringCells = state.currentScoringCells || [];
        this.gameActive = state.gameActive;
    }
}

// UI Manager - All rendering and display logic
class UIManager {
    constructor(gameLogic, multiplayerManager = null) {
        this.gameLogic = gameLogic;
        this.boardSize = gameLogic.boardSize;
        this.multiplayerManager = multiplayerManager;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Core game events
        const newGameBtn = document.getElementById('newGame');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.newGame());
        }

        // Menu navigation
        const menuButtons = {
            'hostGameBtn': () => {
                if (this.multiplayerManager) {
                    this.showHostInterface();
                } else {
                    console.error('MultiplayerManager not available');
                }
            },
            'playLocalBtn': () => this.startLocalGame(),
            'backToMenu': async () => await this.showMainMenu(),
            'backToMenuFromJoin': async () => await this.showMainMenu(),
            'resetSetup': () => this.showSetup(),
            'backToMultiplayer': async () => await this.showMainMenu()
        };

        Object.entries(menuButtons).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });

        // Instructions modal events
        const instructionsBtn = document.getElementById('instructionsBtn');
        const closeInstructions = document.getElementById('closeInstructions');
        const instructionsModal = document.getElementById('instructionsModal');

        if (instructionsBtn) {
            instructionsBtn.addEventListener('click', () => {
                if (instructionsModal) {
                    instructionsModal.classList.remove('hidden');
                }
            });
        }

        if (closeInstructions) {
            closeInstructions.addEventListener('click', () => {
                if (instructionsModal) {
                    instructionsModal.classList.add('hidden');
                }
            });
        }

        // Close modal when clicking outside
        if (instructionsModal) {
            instructionsModal.addEventListener('click', (e) => {
                if (e.target === instructionsModal) {
                    instructionsModal.classList.add('hidden');
                }
            });
        }
    }

    async showMainMenu() {
        this.hideAllInterfaces();
        document.getElementById('mainMenu').style.display = 'block';
        
        // Restore compact size for menu
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.className = 'w-full bg-white rounded-2xl shadow-2xl p-8 max-w-md';
        }
        
        // Check if we're already hosting a game
        const isAlreadyHosting = this.multiplayerManager && this.multiplayerManager.isHost;
        
        const hostGameBtn = document.getElementById('hostGameBtn');
        const joinGameBtn = document.getElementById('joinGameBtn');
        const playLocalBtn = document.getElementById('playLocalBtn');
        
        if (isAlreadyHosting) {
            // If we're already hosting, show host and local buttons immediately
            console.log('Already hosting - showing host and local buttons');
            if (hostGameBtn) hostGameBtn.style.display = 'block';
            if (joinGameBtn) joinGameBtn.style.display = 'none';
            if (playLocalBtn) playLocalBtn.style.display = 'block';
        } else {
            // If we're not hosting, check for available games
            console.log('Not hosting - checking for available games...');
            const isGameAvailable = await this.checkIfGameAvailable();
            console.log('showMainMenu - isGameAvailable:', isGameAvailable);
            
            if (isGameAvailable) {
                // Second player scenario - show only join button in main menu
                console.log('Showing join button in main menu (second player)');
                if (hostGameBtn) hostGameBtn.style.display = 'none';
                if (joinGameBtn) joinGameBtn.style.display = 'block';
                if (playLocalBtn) playLocalBtn.style.display = 'none';
                
                // Set up the join button event listener to show join interface
                if (joinGameBtn && this.multiplayerManager) {
                    console.log('Setting up join button event listener in main menu');
                    // Remove any existing listeners by cloning
                    const newButton = joinGameBtn.cloneNode(true);
                    joinGameBtn.parentNode.replaceChild(newButton, joinGameBtn);
                    
                    // Add the event listener to the new button
                    newButton.addEventListener('click', () => {
                        console.log('Join Game button clicked - showing join interface');
                        this.showJoinInterface();
                    });
                }
            } else {
                // First player scenario - show host and local buttons
                console.log('Showing host interface (first player)');
                if (hostGameBtn) hostGameBtn.style.display = 'block';
                if (joinGameBtn) joinGameBtn.style.display = 'none';
                if (playLocalBtn) playLocalBtn.style.display = 'block';
            }
        }
    }




    async checkIfGameAvailable() {
        return new Promise((resolve) => {
            const maxRetries = 3;
            let retryCount = 0;
            
            const attemptConnection = () => {
                try {
                    console.log(`Checking if game is available... (attempt ${retryCount + 1}/${maxRetries})`, new Date().toISOString());
                    
                    // Try to connect to the fixed game ID to see if a game is hosted
                    const testPeer = new Peer({
                        debug: 3,
                        config: {
                            'iceServers': [
                                { urls: 'stun:stun.l.google.com:19302' },
                                { urls: 'stun:stun1.l.google.com:19302' },
                                { urls: 'stun:stun2.l.google.com:19302' }
                            ]
                        }
                    });

                    let timeoutId;
                    let resolved = false;

                    const cleanup = () => {
                        if (!resolved) {
                            resolved = true;
                            clearTimeout(timeoutId);
                            if (testPeer) {
                                testPeer.destroy();
                            }
                        }
                    };

                    testPeer.on('open', () => {
                        console.log('Test peer opened, attempting connection to whisk-game...');
                        try {
                            const testConnection = testPeer.connect('whisk-game');
                            
                                                    testConnection.on('open', () => {
                            // Connection successful - game is available
                            console.log('Connection successful - game is available');
                            cleanup();
                            // Close the test connection immediately to avoid interference
                            setTimeout(() => {
                                testConnection.close();
                            }, 100);
                            resolve(true);
                        });
                            
                            testConnection.on('error', (error) => {
                                // Connection failed - try again if we have retries left
                                console.log('Connection failed - no game available:', error);
                                cleanup();
                                
                                if (retryCount < maxRetries - 1) {
                                    retryCount++;
                                    console.log(`Retrying connection in 2 seconds... (${retryCount}/${maxRetries})`);
                                    setTimeout(attemptConnection, 2000);
                                } else {
                                    console.log('All retries exhausted - no game available');
                                    resolve(false);
                                }
                            });
                            
                            testConnection.on('close', () => {
                                // Connection closed - this is expected after successful connection
                                console.log('Test connection closed');
                                cleanup();
                                resolve(true);
                            });
                            
                        } catch (connectionError) {
                            console.log('Error creating test connection:', connectionError);
                            cleanup();
                            
                            if (retryCount < maxRetries - 1) {
                                retryCount++;
                                console.log(`Retrying connection in 2 seconds... (${retryCount}/${maxRetries})`);
                                setTimeout(attemptConnection, 2000);
                            } else {
                                console.log('All retries exhausted - no game available');
                                resolve(false);
                            }
                        }
                    });

                    testPeer.on('error', (error) => {
                        console.log('Test peer error:', error);
                        cleanup();
                        
                        if (retryCount < maxRetries - 1) {
                            retryCount++;
                            console.log(`Retrying connection in 2 seconds... (${retryCount}/${maxRetries})`);
                            setTimeout(attemptConnection, 2000);
                        } else {
                            console.log('All retries exhausted - no game available');
                            resolve(false);
                        }
                    });

                    // Timeout after 8 seconds per attempt
                    timeoutId = setTimeout(() => {
                        console.log('Connection timeout - no game available');
                        cleanup();
                        
                        if (retryCount < maxRetries - 1) {
                            retryCount++;
                            console.log(`Retrying connection in 2 seconds... (${retryCount}/${maxRetries})`);
                            setTimeout(attemptConnection, 2000);
                        } else {
                            console.log('All retries exhausted - no game available');
                            resolve(false);
                        }
                    }, 8000);

                } catch (error) {
                    console.log('Error checking game availability:', error);
                    
                    if (retryCount < maxRetries - 1) {
                        retryCount++;
                        console.log(`Retrying connection in 2 seconds... (${retryCount}/${maxRetries})`);
                        setTimeout(attemptConnection, 2000);
                    } else {
                        console.log('All retries exhausted - no game available');
                        resolve(false);
                    }
                }
            };
            
            attemptConnection();
        });
    }

    clearGameData() {
        // No longer using localStorage for game hosting detection
    }

    showHostInterface() {
        this.hideAllInterfaces();
        document.getElementById('hostInterface').style.display = 'block';
        
        // Restore compact size for menu
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.className = 'w-full bg-white rounded-2xl shadow-2xl p-8 max-w-md';
        }
    }

    showJoinInterface() {
        this.hideAllInterfaces();
        document.getElementById('joinInterface').style.display = 'block';
        
        // Restore compact size for menu
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.className = 'w-full bg-white rounded-2xl shadow-2xl p-8 max-w-md';
        }
    }

    showGameInterface() {
        this.hideAllInterfaces();
        document.getElementById('gameInterface').style.display = 'block';
        
        // Expand the container to full width for the game
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.className = 'w-full bg-white rounded-2xl shadow-2xl p-8 max-w-none';
        }
    }

    hideAllInterfaces() {
        const interfaces = ['mainMenu', 'hostInterface', 'joinInterface', 'gameInterface'];
        interfaces.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    createBoard() {
        const gameBoard = document.getElementById('gameBoard');
        if (!gameBoard) return;

        gameBoard.innerHTML = '';
        gameBoard.className = 'grid bg-yellow-100 p-4 rounded-2xl shadow-2xl w-full game-board-grid';
        gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;
        gameBoard.style.aspectRatio = '1 / 1';
        gameBoard.style.maxHeight = '80vh';
        gameBoard.style.gap = '0px';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('button');
                
                cell.className = `grid-cell font-bold cursor-pointer transition-all duration-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:scale-105 min-w-[30px] min-h-[30px] text-4xl`;
                cell.setAttribute('data-row', row);
                cell.setAttribute('data-col', col);
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                gameBoard.appendChild(cell);
            }
        }
    }

    updateBoard() {
        const cells = document.querySelectorAll('[data-row]');
        cells.forEach(cell => {
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            const symbol = this.gameLogic.board[row][col];
            
            console.log(`updateBoard: cell (${row},${col}) has symbol "${symbol}"`);
            cell.textContent = symbol;
            
            // Clear all existing styles first
            cell.classList.remove('fade-0', 'fade-1', 'fade-2', 'fade-3', 'fade-4', 'fade-5', 'fade-6', 'fade-7', 'fade-8', 'fade-9', 'fade-10', 'text-red-600', 'text-blue-600');
            cell.classList.remove('cell-bg-0', 'cell-bg-1', 'cell-bg-2', 'cell-bg-3', 'cell-bg-4', 'cell-bg-5', 'cell-bg-6', 'cell-bg-7', 'cell-bg-8', 'cell-bg-9', 'cell-bg-10');
            cell.style.color = '';
            cell.style.backgroundColor = '';
            cell.style.border = '';
            
            // Only call updateCellStyle for cells that actually have symbols
            if (symbol && symbol !== '') {
                this.updateCellStyle(cell, symbol);
            }
            
            // Only apply scoring highlight if there are scoring cells and this cell is one of them
            if (this.gameLogic.currentScoringCells && this.gameLogic.currentScoringCells.length > 0) {
                this.applyScoringHighlight(cell, row, col);
            }
        });
    }

    applyScoringHighlight(cell, row, col) {
        // Clear any existing scoring highlight
        cell.classList.remove('scoring-highlight');
        
        // Check if this cell is in the current scoring cells
        const isScoringCell = this.gameLogic.currentScoringCells.some(sc => sc.row === row && sc.col === col);
        if (isScoringCell) {
            cell.classList.add('scoring-highlight');
            console.log(`Applied scoring highlight to cell (${row},${col})`);
        }
    }

    updateCellStyle(cell, symbol) {
        console.log(`updateCellStyle called for symbol: "${symbol}" at cell (${cell.getAttribute('data-row')},${cell.getAttribute('data-col')})`);
        
        // Clear any existing fade classes, color classes, and background classes
        cell.classList.remove('fade-0', 'fade-1', 'fade-2', 'fade-3', 'fade-4', 'fade-5', 'fade-6', 'fade-7', 'fade-8', 'fade-9', 'fade-10', 'text-red-600', 'text-blue-600');
        cell.classList.remove('cell-bg-0', 'cell-bg-1', 'cell-bg-2', 'cell-bg-3', 'cell-bg-4', 'cell-bg-5', 'cell-bg-6', 'cell-bg-7', 'cell-bg-8', 'cell-bg-9', 'cell-bg-10');
        cell.classList.remove('scoring-highlight'); // Also clear scoring highlight
        cell.style.color = ''; // Clear inline color styles
        cell.style.backgroundColor = ''; // Clear inline background styles
        cell.style.border = ''; // Clear any test borders
        
        // Only apply styles if there's actually a symbol
        if (symbol === 'X') {
            cell.classList.add('text-red-600');
            console.log(`Applied text-red-600 to X at (${cell.getAttribute('data-row')},${cell.getAttribute('data-col')})`);
        } else if (symbol === 'O') {
            cell.classList.add('text-blue-600');
            console.log(`Applied text-blue-600 to O at (${cell.getAttribute('data-row')},${cell.getAttribute('data-col')})`);
        }
        
        // Apply fading based on symbol age (separate for each player)
        if (symbol && symbol !== '') {
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            
            // Calculate age based on symbol history for this player
            const symbolHistory = this.gameLogic.symbolHistory.filter(s => s.symbol === symbol);
            const symbolInHistory = symbolHistory.find(s => s.row === row && s.col === col);
            
            if (symbolInHistory) {
                const symbolAge = symbolHistory.length - symbolHistory.indexOf(symbolInHistory) - 1;
                const fadeClass = Math.min(symbolAge, 10);
                
                cell.classList.add(`fade-${fadeClass}`);
                cell.classList.add(`cell-bg-${fadeClass}`);
                
                console.log(`Applied fade-${fadeClass} and cell-bg-${fadeClass} to ${symbol} at (${row},${col}), age: ${symbolAge} (total ${symbolHistory.length} ${symbol}s)`);
            }
        }
    }

    updateScoreDisplay() {
        // Get player names from multiplayer manager if available
        let playerOName = 'Player O';
        let playerXName = 'Player X';
        
        if (this.multiplayerManager && this.multiplayerManager.myPlayerName) {
            if (this.multiplayerManager.myPlayerSymbol === 'O') {
                playerOName = this.multiplayerManager.myPlayerName;
                playerXName = this.multiplayerManager.opponentPlayerName || 'Player X';
            } else {
                playerXName = this.multiplayerManager.myPlayerName;
                playerOName = this.multiplayerManager.opponentPlayerName || 'Player O';
            }
        }

        // Update the score labels to show player names
        const scoreOLabel = document.getElementById('scoreOLabel');
        const scoreXLabel = document.getElementById('scoreXLabel');
        if (scoreOLabel) scoreOLabel.textContent = `${playerOName}:`;
        if (scoreXLabel) scoreXLabel.textContent = `${playerXName}:`;
        
        console.log('updateScoreDisplay - playerOName:', playerOName, 'playerXName:', playerXName);

        // Update the score values
        const scoreElements = {
            'scoreO': this.gameLogic.scores.O,
            'scoreX': this.gameLogic.scores.X
        };

        Object.entries(scoreElements).forEach(([id, score]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = score;
            }
        });

        // Update the user name display
        this.updateUserNameDisplay();
    }

    updateUserNameDisplay() {
        const userNameElement = document.getElementById('userName');
        if (!userNameElement) return;

        let displayName = 'Player O';
        if (this.multiplayerManager && this.multiplayerManager.myPlayerName) {
            displayName = this.multiplayerManager.myPlayerName;
        }

        console.log('updateUserNameDisplay called - displayName:', displayName, 'myPlayerName:', this.multiplayerManager?.myPlayerName);
        userNameElement.textContent = displayName;
    }

    updateTurnMessage() {
        const gameStatus = document.getElementById('gameStatus');
        if (!gameStatus) return;

        // Get player names from multiplayer manager if available
        let currentPlayerName = this.gameLogic.currentPlayer;
        if (this.multiplayerManager && this.multiplayerManager.myPlayerName) {
            if (this.gameLogic.currentPlayer === this.multiplayerManager.myPlayerSymbol) {
                currentPlayerName = this.multiplayerManager.myPlayerName;
            } else if (this.multiplayerManager.opponentPlayerName) {
                currentPlayerName = this.multiplayerManager.opponentPlayerName;
            }
        }

        const message = `Current player: ${currentPlayerName}`;
        const color = this.gameLogic.currentPlayer === 'O' ? '#3182ce' : '#e53e3e';
        
        gameStatus.textContent = message;
        gameStatus.style.color = color;
        gameStatus.style.backgroundColor = '#f0f0f0';
        gameStatus.style.padding = '10px';
        gameStatus.style.borderRadius = '5px';
        gameStatus.style.fontSize = '1.2rem';
        gameStatus.style.fontWeight = 'bold';
        gameStatus.style.border = `2px solid ${color}`;
        gameStatus.style.display = 'block';
        gameStatus.style.visibility = 'visible';
    }

    showScoringMessage(points, player) {
        const gameStatus = document.getElementById('gameStatus');
        if (!gameStatus) return;

        const nextPlayer = player === 'O' ? 'X' : 'O';
        
        // Get player names from multiplayer manager if available
        let playerName = player;
        let opponentName = 'your opponent';
        
        if (this.multiplayerManager && this.multiplayerManager.myPlayerName) {
            if (player === this.multiplayerManager.myPlayerSymbol) {
                playerName = this.multiplayerManager.myPlayerName;
                opponentName = this.multiplayerManager.opponentPlayerName || 'your opponent';
            } else {
                playerName = this.multiplayerManager.opponentPlayerName || player;
                opponentName = this.multiplayerManager.myPlayerName;
            }
        }

        const message = points === 1 ?
            `${playerName} scored 1 point. It is ${opponentName}'s turn` :
            `${playerName} scored ${points} points. It is ${opponentName}'s turn`;
        const color = nextPlayer === 'O' ? '#3182ce' : '#e53e3e';

        gameStatus.textContent = message;
        gameStatus.style.color = color;
        gameStatus.style.backgroundColor = '#f0f0f0';
        gameStatus.style.padding = '10px';
        gameStatus.style.borderRadius = '5px';
        gameStatus.style.fontSize = '1.2rem';
        gameStatus.style.fontWeight = 'bold';
        gameStatus.style.border = `2px solid ${color}`;
        gameStatus.style.display = 'block';
        gameStatus.style.visibility = 'visible';
    }

    handleCellClick(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const cellTextContent = cell ? cell.textContent : 'cell not found';
        console.log(`handleCellClick called for cell (${row},${col}), board value: "${this.gameLogic.board[row][col]}", cell textContent: "${cellTextContent}", gameActive: ${this.gameLogic.gameActive}, currentPlayer: ${this.gameLogic.currentPlayer}`);
        
        if (!this.gameLogic.gameActive || this.gameLogic.board[row][col] !== '' || 
            this.gameLogic.currentPlayer !== this.gameLogic.currentPlayer) { // This line seems to be a bug, should be this.gameLogic.currentPlayer
            console.log(`handleCellClick returning early - gameActive: ${this.gameLogic.gameActive}, board empty: ${this.gameLogic.board[row][col] === ''}, currentPlayer check: ${this.gameLogic.currentPlayer !== this.gameLogic.currentPlayer}`);
            return;
        }

        const result = this.gameLogic.makeMove(row, col, this.gameLogic.currentPlayer);
        
        if (result.success) {
            this.updateBoard();
            this.updateScoreDisplay();
            
            if (result.scoringResult.totalPoints > 0) {
                this.showScoringMessage(result.scoringResult.totalPoints, this.gameLogic.currentPlayer === 'O' ? 'X' : 'O');
            } else {
                this.updateTurnMessage();
            }
        }
    }

    startLocalGame() {
        this.gameLogic.reset();
        this.gameLogic.gameActive = true;
        this.showGameInterface();
        this.createBoard();
        this.updateBoard();
        this.updateScoreDisplay();
        this.updateTurnMessage();
    }

    newGame() {
        this.gameLogic.reset();
        this.gameLogic.gameActive = true;
        this.updateBoard();
        this.updateScoreDisplay();
        this.updateTurnMessage();
    }
}

// Multiplayer Manager - All networking logic
class MultiplayerManager {
    constructor(gameLogic, uiManager) {
        this.gameLogic = gameLogic;
        this.uiManager = uiManager;
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.myPlayerSymbol = 'O';
        this.opponentPlayerSymbol = 'X';
        this.gameId = null;
        this.connected = false;
        this.myPlayerName = '';
        this.opponentPlayerName = '';
        
        this.initializeMultiplayerEventListeners();
        this.initializePageRefreshHandling();
    }

    initializeMultiplayerEventListeners() {
        const multiplayerButtons = {
            'joinGame': () => this.joinGame(),
            'copyGameId': () => this.copyGameId(),
            'submitHostName': () => this.handleHostNameSubmit(),
            'submitJoinName': () => this.handleJoinNameSubmit()
        };

        Object.entries(multiplayerButtons).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    initializePageRefreshHandling() {
        // Handle page refresh/close to clean up connections
        // Only cleanup if we're not hosting a game
        window.addEventListener('beforeunload', () => {
            if (this.connected || this.peer && !this.isHost) {
                console.log('Page refresh detected - cleaning up connections (not hosting)');
                this.cleanupConnections();
            }
        });

        // Also handle page visibility change (tab switching)
        // Disabled for now to prevent connection cleanup during game
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && (this.connected || this.peer)) {
                console.log('Page hidden - but keeping connection active (disabled cleanup)');
            }
        });
    }

    cleanupConnections() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        this.connected = false;
    }

    async hostGame() {
        try {
            console.log('Creating host game with ID: whisk-game', new Date().toISOString());
            
            this.peer = new Peer('whisk-game', {
                debug: 3,
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' }
                    ]
                }
            });

            this.peer.on('open', (id) => {
                this.gameId = id;
                this.isHost = true;
                this.myPlayerSymbol = 'O';
                this.opponentPlayerSymbol = 'X';
                
                console.log('Host peer opened with ID:', id, new Date().toISOString());
                console.log('Host is now ready for connections');
                
                console.log('Host game created and ready for connections');
            });

            this.peer.on('error', (error) => {
                console.error('Host peer error:', error, new Date().toISOString());
                // Try to recreate the peer if there's an error
                if (this.peer) {
                    this.peer.destroy();
                    this.peer = null;
                }
            });

            this.peer.on('connection', (conn) => {
                console.log('Host received connection from player:', new Date().toISOString());
                this.connection = conn;
                this.setupHostConnection();
                
                // Update status when someone joins
                const connectionStatus = document.getElementById('connectionStatus');
                if (connectionStatus) {
                    connectionStatus.textContent = 'Player joined! Starting game...';
                }
            });

            this.peer.on('disconnected', () => {
                console.log('Host peer disconnected:', new Date().toISOString());
            });

            this.peer.on('close', () => {
                console.log('Host peer closed:', new Date().toISOString());
            });

        } catch (error) {
            console.error('Failed to create host game:', error);
        }
    }

    async joinGame() {
        console.log('joinGame() method called');
        // For simplicity, we'll use a fixed game ID or try to detect the host
        const gameId = 'whisk-game'; // Simple fixed ID for now
        
        try {
            console.log('Creating peer for joining game...');
            this.peer = new Peer({
                debug: 3,
                config: {
                    'iceServers': [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' }
                    ]
                }
            });

            this.peer.on('open', () => {
                console.log('Joining peer opened, connecting to host...');
                this.connection = this.peer.connect(gameId);
                this.setupConnection();
            });

        } catch (error) {
            console.error('Failed to join game:', error);
        }
    }

    setupHostConnection() {
        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
            if (!this.connected) {
                console.log('Host: Connection timeout - no player joined');
                this.handleDisconnection();
            }
        }, 30000); // 30 second timeout

        this.connection.on('open', () => {
            clearTimeout(connectionTimeout);
            this.connected = true;
            // Host keeps isHost = true, myPlayerSymbol = 'O'
            console.log('Host: Connection established with joining player');
            
            // Send player name to opponent
            this.connection.send({
                type: 'playerName',
                playerName: this.myPlayerName
            });
            
            console.log('Host: Starting multiplayer game...');
            // Add a small delay to ensure connection is stable
            setTimeout(() => {
                this.startMultiplayerGame();
            }, 500);
        });

        this.connection.on('data', (data) => {
            this.handleMultiplayerData(data);
        });

        this.connection.on('close', () => {
            clearTimeout(connectionTimeout);
            console.log('Host: Connection closed by peer');
            console.log('Host: Connection state before disconnection:', this.connected);
            this.handleDisconnection();
        });
    }

    setupConnection() {
        // Add connection timeout
        const connectionTimeout = setTimeout(() => {
            if (!this.connected) {
                console.log('Joining player: Connection timeout - host not responding');
                this.handleDisconnection();
            }
        }, 30000); // 30 second timeout

        this.connection.on('open', () => {
            clearTimeout(connectionTimeout);
            this.connected = true;
            this.isHost = false;
            this.myPlayerSymbol = 'X';
            this.opponentPlayerSymbol = 'O';
            
            console.log('Joining player: Connection established with host');
            
            // Send player name to opponent
            this.connection.send({
                type: 'playerName',
                playerName: this.myPlayerName
            });
            
            console.log('Joining player: Starting multiplayer game...');
            // Add a small delay to ensure connection is stable
            setTimeout(() => {
                this.startMultiplayerGame();
            }, 500);
        });

        this.connection.on('data', (data) => {
            this.handleMultiplayerData(data);
        });

        this.connection.on('close', () => {
            clearTimeout(connectionTimeout);
            console.log('Joining player: Connection closed by peer');
            console.log('Joining player: Connection state before disconnection:', this.connected);
            this.handleDisconnection();
        });
    }

    startMultiplayerGame() {
        console.log('startMultiplayerGame() called');
        this.gameLogic.reset();
        this.gameLogic.gameActive = true;
        console.log('Game logic reset and activated');
        this.uiManager.showGameInterface();
        console.log('Game interface shown');
        this.uiManager.createBoard();
        this.uiManager.updateBoard();
        this.uiManager.updateScoreDisplay();
        this.updateTurnMessage();
        console.log('Multiplayer game started successfully');
    }

    updateTurnMessage() {
        const gameStatus = document.getElementById('gameStatus');
        if (!gameStatus) return;

        let message, color;
        
        if (this.gameLogic.currentPlayer === this.myPlayerSymbol) {
            message = 'It is your turn';
            color = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e';
        } else {
            const opponentName = this.opponentPlayerName || 'your opponent';
            message = `It is ${opponentName}'s turn`;
            color = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e';
        }

        gameStatus.textContent = message;
        gameStatus.style.color = color;
        gameStatus.style.backgroundColor = '#f0f0f0';
        gameStatus.style.padding = '10px';
        gameStatus.style.borderRadius = '5px';
        gameStatus.style.fontSize = '1.2rem';
        gameStatus.style.fontWeight = 'bold';
        gameStatus.style.border = `2px solid ${color}`;
        gameStatus.style.display = 'block';
        gameStatus.style.visibility = 'visible';
    }

    showMultiplayerScoringMessage(points, player) {
        const gameStatus = document.getElementById('gameStatus');
        if (!gameStatus) return;

        let message, color;
        
        if (player === this.myPlayerSymbol) {
            const opponentName = this.opponentPlayerName || 'your opponent';
            message = `You scored ${points} point${points !== 1 ? 's' : ''}. It is ${opponentName}'s turn`;
            color = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e';
        } else {
            const myName = this.myPlayerName || 'you';
            message = `${this.opponentPlayerName || 'Your opponent'} scored ${points} point${points !== 1 ? 's' : ''}. It is ${myName}'s turn`;
            color = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e';
        }

        gameStatus.textContent = message;
        gameStatus.style.color = color;
        gameStatus.style.backgroundColor = '#f0f0f0';
        gameStatus.style.padding = '10px';
        gameStatus.style.borderRadius = '5px';
        gameStatus.style.fontSize = '1.2rem';
        gameStatus.style.fontWeight = 'bold';
        gameStatus.style.border = `2px solid ${color}`;
        gameStatus.style.display = 'block';
        gameStatus.style.visibility = 'visible';
    }

    handleCellClick(row, col) {
        if (!this.gameLogic.gameActive || this.gameLogic.board[row][col] !== '' || 
            this.gameLogic.currentPlayer !== this.myPlayerSymbol) {
            return;
        }

        const result = this.gameLogic.makeMove(row, col, this.myPlayerSymbol);
        
        if (result.success) {
            this.uiManager.updateBoard();
            this.uiManager.updateScoreDisplay();
            
            // Send move to opponent
            this.connection.send({
                type: 'move',
                row: row,
                col: col,
                gameState: this.gameLogic.getGameState()
            });

            if (result.scoringResult.totalPoints > 0) {
                this.showMultiplayerScoringMessage(result.scoringResult.totalPoints, this.myPlayerSymbol);
            } else {
                this.updateTurnMessage();
            }
        }
    }

    handleMultiplayerData(data) {
        switch (data.type) {
            case 'move':
                this.handleOpponentMove(data.row, data.col, data.gameState);
                break;
            case 'newGame':
                this.handleNewGameFromOpponent();
                break;
            case 'playerName':
                this.opponentPlayerName = data.playerName;
                console.log('Received opponent name:', data.playerName);
                console.log('Current myPlayerName:', this.myPlayerName, 'opponentPlayerName:', this.opponentPlayerName);
                // Update the UI with the new player names
                this.uiManager.updateScoreDisplay();
                break;
        }
    }

    handleOpponentMove(row, col, gameState) {
        this.gameLogic.setGameState(gameState);
        
        // Clear scoring highlighting when opponent makes a move
        this.gameLogic.currentScoringCells = [];
        
        this.uiManager.updateBoard();
        this.uiManager.updateScoreDisplay();
        
        const scoringResult = this.gameLogic.checkScoring(row, col);
        if (scoringResult.totalPoints > 0) {
            this.showMultiplayerScoringMessage(scoringResult.totalPoints, this.opponentPlayerSymbol);
        } else {
            this.updateTurnMessage();
        }
    }

    handleNewGameFromOpponent() {
        this.gameLogic.reset();
        this.gameLogic.gameActive = true;
        this.uiManager.updateBoard();
        this.uiManager.updateScoreDisplay();
        this.updateTurnMessage();
    }

    handleDisconnection() {
        this.connected = false;
        console.log('Connection lost. Returning to main menu.');
        // Use a timeout to prevent potential loops
        setTimeout(() => {
            this.uiManager.showMainMenu();
        }, 100);
    }

    copyGameId() {
        if (this.gameId) {
            navigator.clipboard.writeText(this.gameId);
            alert('Game ID copied to clipboard!');
        }
    }

    async showMainMenu() {
        await this.uiManager.showMainMenu();
    }

    handleHostNameSubmit() {
        const hostNameInput = document.getElementById('hostName');
        const hostName = hostNameInput.value.trim();
        
        if (hostName === '') {
            alert('Please enter your name.');
            return;
        }
        
        this.myPlayerName = hostName;
        console.log('Host name set to:', this.myPlayerName);
        
        // Hide the name input and show the waiting message
        document.getElementById('hostNameInput').style.display = 'none';
        document.getElementById('hostWaiting').classList.remove('hidden');
        
        // Start hosting the game
        this.hostGame();
    }

    handleJoinNameSubmit() {
        const joinNameInput = document.getElementById('joinName');
        const joinName = joinNameInput.value.trim();
        
        if (joinName === '') {
            alert('Please enter your name.');
            return;
        }
        
        this.myPlayerName = joinName;
        console.log('Join name set to:', this.myPlayerName);
        
        // Hide the name input and show connecting message
        document.getElementById('joinNameInput').style.display = 'none';
        document.getElementById('joinGameSection').classList.remove('hidden');
        
        // Update the join status to show connecting
        const joinStatus = document.getElementById('joinStatus');
        if (joinStatus) {
            joinStatus.textContent = 'Connecting to game...';
            joinStatus.style.color = '#059669'; // Green color
        }
        
        // Connect directly after name submission
        console.log('Name submitted, connecting to game...');
        this.joinGame();
    }
}

console.log('Whisk: script.js loaded and running (latest version) - Timestamp:', new Date().toISOString());

// Main Game Controller - Orchestrates everything
class TicTacToeGame {
    constructor() {
        console.log('TicTacToeGame constructor called');
        this.gameLogic = new GameLogic();
        console.log('GameLogic created');
        this.multiplayerManager = new MultiplayerManager(this.gameLogic, null); // Will update uiManager reference later
        console.log('MultiplayerManager created');
        this.uiManager = new UIManager(this.gameLogic, this.multiplayerManager);
        console.log('UIManager created');
        // Update the multiplayerManager's uiManager reference
        this.multiplayerManager.uiManager = this.uiManager;
        
        // Store the original handleCellClick method
        const originalHandleCellClick = this.uiManager.handleCellClick.bind(this.uiManager);
        
        // Override UI manager's cell click to handle multiplayer
        this.uiManager.handleCellClick = (row, col) => {
            if (this.multiplayerManager.connected) {
                this.multiplayerManager.handleCellClick(row, col);
            } else {
                originalHandleCellClick(row, col);
            }
        };
        console.log('TicTacToeGame constructor completed');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded event fired');
    
    // Clear any stale game data on fresh page load
    if (!localStorage.getItem('gameHosted')) {
        localStorage.removeItem('gameHosted');
    }
    
    console.log('Creating TicTacToeGame instance...');
    window.game = new TicTacToeGame();
    console.log('TicTacToeGame created:', window.game);
    
    // Always show main menu with all buttons visible
    if (window.game && window.game.uiManager) {
        console.log('Calling showMainMenu...');
        await window.game.uiManager.showMainMenu();
    } else {
        console.log('Error: game or uiManager not available');
        console.log('window.game:', window.game);
        console.log('window.game.uiManager:', window.game ? window.game.uiManager : 'undefined');
    }
}); 