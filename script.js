console.log("Whisk: script.js loaded and running (latest version)");
// Core Game Logic - Pure game state and rules
class GameLogic {
    constructor(boardSize = 8, persistence = 5) {
        this.boardSize = boardSize;
        this.persistence = persistence;
        this.fadeHistory = []; // Separate history for fading calculations
        console.log('GameLogic created with persistence:', this.persistence, 'boardSize:', this.boardSize);
        this.reset();
    }

    reset() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(''));
        this.currentPlayer = 'O';
        this.gameActive = false;
        this.winningCells = [];
        this.symbolHistory = [];
        this.fadeHistory = []; // Reset fade history
        this.symbolCounts = { O: 0, X: 0 };
        this.scores = { O: 0, X: 0 };
    }

    makeMove(row, col, player) {
        if (!this.gameActive || this.board[row][col] !== '') {
            return { success: false, message: 'Invalid move' };
        }

        this.board[row][col] = player;
        this.symbolCounts[player]++;
        
        // Add to history
        this.symbolHistory.push({
            symbol: player,
            row: row,
            col: col,
            timestamp: Date.now()
        });
        
        // Add to fade history (always keep this for fading calculations)
        this.fadeHistory.push({
            symbol: player,
            row: row,
            col: col,
            timestamp: Date.now()
        });

        // Check for scoring
        const scoringResult = this.checkScoring(row, col);
        if (scoringResult.totalPoints > 0) {
            this.scores[player] += scoringResult.totalPoints;
        }

        // Switch players
        this.currentPlayer = this.currentPlayer === 'O' ? 'X' : 'O';

        // Manage persistence
        this.managePersistence();

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

        // Check horizontal lines
        const horizontalResult = this.checkLineForScoring(row, 0, 0, 1, player);
        totalPoints += horizontalResult.points;
        scoringCells.push(...horizontalResult.cells);

        // Check vertical lines
        const verticalResult = this.checkLineForScoring(0, col, 1, 0, player);
        totalPoints += verticalResult.points;
        scoringCells.push(...verticalResult.cells);

        // Check diagonals
        const diagonalResults = this.checkDiagonalThroughCell(row, col, player);
        totalPoints += diagonalResults.points;
        scoringCells.push(...diagonalResults.cells);

        return { totalPoints, scoringCells };
    }

    checkLineForScoring(startRow, startCol, deltaRow, deltaCol, player) {
        let points = 0;
        let cells = [];

        // Check for lines of 3 or more
        for (let i = 0; i < this.boardSize; i++) {
            const row = startRow + i * deltaRow;
            const col = startCol + i * deltaCol;
            
            if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
                break;
            }
            
            if (this.board[row][col] !== player) {
                break;
            }
            
            cells.push({ row, col });
        }

        // Calculate points based on line length
        if (cells.length === 3) {
            points = 1;
        } else if (cells.length === 4) {
            points = 3;
        } else if (cells.length >= 5) {
            points = 5;
        }

        return { points, cells };
    }

    checkDiagonalThroughCell(row, col, player) {
        let totalPoints = 0;
        let totalCells = [];

        // Check all possible diagonal directions
        const directions = [
            { deltaRow: -1, deltaCol: -1 }, // Top-left to bottom-right
            { deltaRow: -1, deltaCol: 1 },  // Top-right to bottom-left
            { deltaRow: 1, deltaCol: -1 },  // Bottom-left to top-right
            { deltaRow: 1, deltaCol: 1 }    // Bottom-right to top-left
        ];

        directions.forEach(({ deltaRow, deltaCol }) => {
            // Find the start of the diagonal line
            let startRow = row;
            let startCol = col;
            
            // Go backwards to find the start
            while (startRow - deltaRow >= 0 && startRow - deltaRow < this.boardSize &&
                   startCol - deltaCol >= 0 && startCol - deltaCol < this.boardSize &&
                   this.board[startRow - deltaRow][startCol - deltaCol] === player) {
                startRow -= deltaRow;
                startCol -= deltaCol;
            }

            // Check the line from start
            const result = this.checkLineForScoring(startRow, startCol, deltaRow, deltaCol, player);
            totalPoints += result.points;
            totalCells.push(...result.cells);
        });

        return { points: totalPoints, cells: totalCells };
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
        
        // Remove oldest symbols from board for each player if they exceed persistence limit
        Object.keys(playerHistory).forEach(player => {
            while (playerHistory[player].length > this.persistence) {
                const oldestSymbol = playerHistory[player].shift();
                this.board[oldestSymbol.row][oldestSymbol.col] = '';
                this.symbolCounts[oldestSymbol.symbol]--;
                console.log('Removed symbol from board:', oldestSymbol.symbol, 'at', oldestSymbol.row, oldestSymbol.col);
            }
        });
        
        // Don't modify symbolHistory - keep it for fading calculations
        
        console.log('After persistence management - O symbols:', playerHistory.O.length, 'X symbols:', playerHistory.X.length);
    }

    getGameState() {
        return {
            board: this.board,
            currentPlayer: this.currentPlayer,
            scores: this.scores,
            symbolHistory: this.symbolHistory,
            symbolCounts: this.symbolCounts,
            gameActive: this.gameActive
        };
    }

    setGameState(state) {
        this.board = state.board;
        this.currentPlayer = state.currentPlayer;
        this.scores = state.scores;
        this.symbolHistory = state.symbolHistory;
        this.symbolCounts = state.symbolCounts;
        this.gameActive = state.gameActive;
    }
}

// UI Manager - All rendering and display logic
class UIManager {
    constructor(gameLogic) {
        this.gameLogic = gameLogic;
        this.boardSize = gameLogic.boardSize;
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
            'hostGameBtn': () => this.showHostInterface(),
            'joinGameBtn': () => this.showJoinInterface(),
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
        
        // Check if a game is available to join
        const isGameAvailable = await this.checkIfGameAvailable();
        console.log('showMainMenu - isGameAvailable:', isGameAvailable);
        
        const hostGameBtn = document.getElementById('hostGameBtn');
        const joinGameBtn = document.getElementById('joinGameBtn');
        const playLocalBtn = document.getElementById('playLocalBtn');
        
        if (isGameAvailable) {
            // Second player scenario - show only join button
            console.log('Showing join interface (second player)');
            if (hostGameBtn) hostGameBtn.style.display = 'none';
            if (joinGameBtn) joinGameBtn.style.display = 'block';
            if (playLocalBtn) playLocalBtn.style.display = 'none';
        } else {
            // First player scenario - show host and local buttons
            console.log('Showing host interface (first player)');
            if (hostGameBtn) hostGameBtn.style.display = 'block';
            if (joinGameBtn) joinGameBtn.style.display = 'none';
            if (playLocalBtn) playLocalBtn.style.display = 'block';
        }
    }




    async checkIfGameAvailable() {
        return new Promise((resolve) => {
            try {
                // Try to connect to the fixed game ID to see if a game is hosted
                const testPeer = new Peer({
                    debug: 0,
                    config: {
                        'iceServers': [
                            { urls: 'stun:stun.l.google.com:19302' }
                        ]
                    }
                });

                testPeer.on('open', () => {
                    const testConnection = testPeer.connect('whisk-game');
                    
                    testConnection.on('open', () => {
                        // Connection successful - game is available
                        testConnection.close();
                        testPeer.destroy();
                        resolve(true);
                    });
                    
                    testConnection.on('error', () => {
                        // Connection failed - no game available
                        testPeer.destroy();
                        resolve(false);
                    });
                    
                    // Timeout after 3 seconds
                    setTimeout(() => {
                        testPeer.destroy();
                        resolve(false);
                    }, 3000);
                });

                testPeer.on('error', () => {
                    resolve(false);
                });

            } catch (error) {
                console.log('Error checking game availability:', error);
                resolve(false);
            }
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
        
        // Show join button, hide host and local buttons (second player scenario)
        const hostGameBtn = document.getElementById('hostGameBtn');
        const joinGameBtn = document.getElementById('joinGameBtn');
        const playLocalBtn = document.getElementById('playLocalBtn');
        
        if (hostGameBtn) hostGameBtn.style.display = 'none';
        if (joinGameBtn) joinGameBtn.style.display = 'block';
        if (playLocalBtn) playLocalBtn.style.display = 'none';
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
        gameBoard.className = 'grid gap-1 bg-yellow-100 p-2 rounded-2xl shadow-2xl w-full';
        gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;
        gameBoard.style.aspectRatio = '1 / 1';
        gameBoard.style.maxHeight = '80vh';

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('button');
                
                cell.className = `border border-black font-bold cursor-pointer transition-all duration-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:scale-105 min-w-[30px] min-h-[30px] text-4xl`;
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
            
            cell.textContent = symbol;
            
            // Only call updateCellStyle for cells that actually have symbols
            if (symbol && symbol !== '') {
                this.updateCellStyle(cell, symbol);
            } else {
                // Clear any existing styles for empty cells
                cell.classList.remove('fade-0', 'fade-1', 'fade-2', 'fade-3', 'fade-4', 'fade-5', 'fade-6', 'fade-7', 'fade-8', 'fade-9', 'fade-10', 'text-red-600', 'text-blue-600');
                cell.classList.remove('cell-bg-0', 'cell-bg-1', 'cell-bg-2', 'cell-bg-3', 'cell-bg-4', 'cell-bg-5', 'cell-bg-6', 'cell-bg-7', 'cell-bg-8', 'cell-bg-9', 'cell-bg-10');
                cell.style.color = '';
                cell.style.backgroundColor = '';
                cell.style.border = '';
            }
        });
    }

    updateCellStyle(cell, symbol) {
        console.log(`updateCellStyle called for symbol: "${symbol}" from:`, new Error().stack.split('\n')[2]);
        
        // Clear any existing fade classes, color classes, and background classes
        cell.classList.remove('fade-0', 'fade-1', 'fade-2', 'fade-3', 'fade-4', 'fade-5', 'fade-6', 'fade-7', 'fade-8', 'fade-9', 'fade-10', 'text-red-600', 'text-blue-600');
        cell.classList.remove('cell-bg-0', 'cell-bg-1', 'cell-bg-2', 'cell-bg-3', 'cell-bg-4', 'cell-bg-5', 'cell-bg-6', 'cell-bg-7', 'cell-bg-8', 'cell-bg-9', 'cell-bg-10');
        cell.style.color = ''; // Clear inline color styles
        cell.style.backgroundColor = ''; // Clear inline background styles
        cell.style.border = ''; // Clear any test borders
        
        // Only apply styles if there's actually a symbol
        if (symbol === 'X') {
            cell.classList.add('text-red-600');
        } else if (symbol === 'O') {
            cell.classList.add('text-blue-600');
        }
        
        // Apply fading based on symbol age (separate for each player)
        if (symbol && symbol !== '') {
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            
            // Find this symbol in the fade history
            const symbolIndex = this.gameLogic.fadeHistory.findIndex(s => s.row === row && s.col === col && s.symbol === symbol);
            
            if (symbolIndex !== -1) {
                // Calculate age based on how many symbols of the same type came after this one
                const symbolHistory = this.gameLogic.fadeHistory.filter(s => s.symbol === symbol);
                const symbolInHistory = symbolHistory.find(s => s.row === row && s.col === col);
                
                // Only apply fading if we found this symbol in the history
                if (symbolInHistory) {
                    const symbolAge = symbolHistory.length - symbolHistory.indexOf(symbolInHistory) - 1;
                
                    const fadeClass = Math.min(symbolAge, 10);
                    cell.classList.add(`fade-${fadeClass}`);
                    cell.classList.add(`cell-bg-${fadeClass}`);
                    
                    // Force a style update by accessing computed styles
                    const computedOpacity = window.getComputedStyle(cell).opacity;
                    const computedBackground = window.getComputedStyle(cell).backgroundColor;
                    
                    console.log(`Applied fade-${fadeClass} and cell-bg-${fadeClass} to ${symbol} at (${row},${col}), age: ${symbolAge} (total ${symbolHistory.length} ${symbol}s)`);
                    console.log(`Full fadeHistory:`, this.gameLogic.fadeHistory.map(s => `${s.symbol}@(${s.row},${s.col})`));
                    console.log(`Symbol history for ${symbol}:`, symbolHistory.map(s => `${s.symbol}@(${s.row},${s.col})`));
                    console.log(`Cell classes after applying fade:`, cell.className);
                    console.log(`Cell computed styles:`, {
                        opacity: computedOpacity,
                        backgroundColor: computedBackground
                    });
                    
                    // Force a repaint
                    cell.offsetHeight;
                    
                    // Test: Apply a very obvious style to verify CSS is working
                    if (fadeClass > 5) {
                        cell.style.border = '3px solid red';
                        console.log(`Applied red border to test CSS application`);
                    }
                    
                    // Direct test: Apply inline styles to see if they work
                    if (fadeClass > 3) {
                        cell.style.opacity = '0.3';
                        cell.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
                        console.log(`Applied inline styles: opacity=0.3, background=red`);
                    }
                }
            }
        }
    }

    updateScoreDisplay() {
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
    }

    updateTurnMessage() {
        const gameStatus = document.getElementById('gameStatus');
        if (!gameStatus) return;

        const message = `Current player: ${this.gameLogic.currentPlayer}`;
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
        const message = points === 1 ?
            `${player} scores 1 point! Current player: ${nextPlayer}` :
            `${player} scores ${points} points! Current player: ${nextPlayer}`;
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
        if (!this.gameLogic.gameActive || this.gameLogic.board[row][col] !== '' || 
            this.gameLogic.currentPlayer !== this.gameLogic.currentPlayer) { // This line seems to be a bug, should be this.gameLogic.currentPlayer
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
        
        this.initializeMultiplayerEventListeners();
    }

    initializeMultiplayerEventListeners() {
        const multiplayerButtons = {
            'joinGame': () => this.joinGame(),
            'copyGameId': () => this.copyGameId()
        };

        Object.entries(multiplayerButtons).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    async hostGame() {
        try {
            this.peer = new Peer('whisk-game', {
                debug: 2,
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
                
                console.log('Game hosted with ID:', id);
                
                // Update the connection status message
                const connectionStatus = document.getElementById('connectionStatus');
                if (connectionStatus) {
                    connectionStatus.textContent = 'Waiting for player to join...';
                }
                
                console.log('Host game created with ID:', id);
            });

            this.peer.on('connection', (conn) => {
                this.connection = conn;
                this.setupConnection();
                
                // Update status when someone joins
                const connectionStatus = document.getElementById('connectionStatus');
                if (connectionStatus) {
                    connectionStatus.textContent = 'Player joined! Starting game...';
                }
            });

        } catch (error) {
            console.error('Failed to create host game:', error);
        }
    }

    async joinGame() {
        // For simplicity, we'll use a fixed game ID or try to detect the host
        const gameId = 'whisk-game'; // Simple fixed ID for now
        
        try {
            this.peer = new Peer({
                debug: 2,
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
                this.connection = this.peer.connect(gameId);
                this.setupConnection();
            });

        } catch (error) {
            console.error('Failed to join game:', error);
        }
    }

    setupConnection() {
        this.connection.on('open', () => {
            this.connected = true;
            this.isHost = false;
            this.myPlayerSymbol = 'X';
            this.opponentPlayerSymbol = 'O';
            
            this.startMultiplayerGame();
        });

        this.connection.on('data', (data) => {
            this.handleMultiplayerData(data);
        });

        this.connection.on('close', () => {
            this.handleDisconnection();
        });
    }

    startMultiplayerGame() {
        this.gameLogic.reset();
        this.gameLogic.gameActive = true;
        this.uiManager.showGameInterface();
        this.uiManager.createBoard();
        this.uiManager.updateBoard();
        this.uiManager.updateScoreDisplay();
        this.updateTurnMessage();
    }

    updateTurnMessage() {
        const gameStatus = document.getElementById('gameStatus');
        if (!gameStatus) return;

        let message, color;
        
        if (this.gameLogic.currentPlayer === this.myPlayerSymbol) {
            message = 'It is your turn';
            color = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e';
        } else {
            message = "It is your opponent's turn";
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
            message = `You scored ${points} point${points !== 1 ? 's' : ''}! It is your opponent's turn.`;
            color = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e';
        } else {
            message = `Your opponent scored ${points} point${points !== 1 ? 's' : ''}! It is your turn.`;
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
        }
    }

    handleOpponentMove(row, col, gameState) {
        this.gameLogic.setGameState(gameState);
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
        alert('Connection lost. Returning to main menu.');
        this.uiManager.showMainMenu();
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
}

console.log('Whisk: script.js loaded and running (latest version) - Timestamp:', new Date().toISOString());

// Main Game Controller - Orchestrates everything
class TicTacToeGame {
    constructor() {
        console.log('TicTacToeGame constructor called');
        this.gameLogic = new GameLogic();
        console.log('GameLogic created');
        this.uiManager = new UIManager(this.gameLogic);
        console.log('UIManager created');
        this.multiplayerManager = new MultiplayerManager(this.gameLogic, this.uiManager);
        console.log('MultiplayerManager created');
        
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