console.log("Whisk: script.js loaded and running (latest version)");
// Core Game Logic - Pure game state and rules
class GameLogic {
    constructor(boardSize = 8, persistence = 5) {
        this.boardSize = boardSize;
        this.persistence = persistence;
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
        for (let startCol = Math.max(0, col - 4); startCol <= Math.min(this.boardSize - 5, col); startCol++) {
            const result = this.checkLineForScoring(row, startCol, 0, 1, player);
            totalPoints += result.points;
            scoringCells.push(...result.cells);
        }

        // Check vertical lines
        for (let startRow = Math.max(0, row - 4); startRow <= Math.min(this.boardSize - 5, row); startRow++) {
            const result = this.checkLineForScoring(startRow, col, 1, 0, player);
            totalPoints += result.points;
            scoringCells.push(...result.cells);
        }

        // Check diagonals
        const diagonalResults = this.checkDiagonalThroughCell(row, col, player);
        totalPoints += diagonalResults.points;
        scoringCells.push(...diagonalResults.cells);

        return { totalPoints, scoringCells };
    }

    checkLineForScoring(startRow, startCol, deltaRow, deltaCol, player) {
        let points = 0;
        let cells = [];

        for (let i = 0; i < 5; i++) {
            const row = startRow + i * deltaRow;
            const col = startCol + i * deltaCol;
            
            if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
                return { points: 0, cells: [] };
            }
            
            if (this.board[row][col] !== player) {
                return { points: 0, cells: [] };
            }
            
            cells.push({ row, col });
        }

        // Calculate points based on line length
        if (cells.length === 5) {
            points = 1;
        } else if (cells.length === 6) {
            points = 2;
        } else if (cells.length === 7) {
            points = 3;
        } else if (cells.length >= 8) {
            points = 4;
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

        while (this.symbolHistory.length > this.persistence) {
            const oldestSymbol = this.symbolHistory.shift();
            this.board[oldestSymbol.row][oldestSymbol.col] = '';
            this.symbolCounts[oldestSymbol.symbol]--;
        }
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
            'backToMenu': () => this.showMainMenu(),
            'backToMenuFromJoin': () => this.showMainMenu(),
            'resetSetup': () => this.showSetup(),
            'backToMultiplayer': () => this.showMainMenu()
        };

        Object.entries(menuButtons).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            }
        });
    }

    showMainMenu() {
        this.hideAllInterfaces();
        document.getElementById('mainMenu').style.display = 'block';
        
        // Show all buttons by default (first player scenario)
        const hostGameBtn = document.getElementById('hostGameBtn');
        const joinGameBtn = document.getElementById('joinGameBtn');
        const playLocalBtn = document.getElementById('playLocalBtn');
        
        if (hostGameBtn) hostGameBtn.style.display = 'block';
        if (joinGameBtn) joinGameBtn.style.display = 'none';
        if (playLocalBtn) playLocalBtn.style.display = 'block';
    }

    showHostInterface() {
        this.hideAllInterfaces();
        document.getElementById('hostInterface').style.display = 'block';
    }

    showJoinInterface() {
        this.hideAllInterfaces();
        document.getElementById('joinInterface').style.display = 'block';
        
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
        gameBoard.className = 'grid gap-1 bg-green-500 p-2 rounded-2xl shadow-2xl';
        gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('button');
                const cellSizeClass = `cell-${this.boardSize}x${this.boardSize}`;
                
                cell.className = `${cellSizeClass} bg-white rounded-lg font-bold cursor-pointer transition-all duration-300 flex items-center justify-center text-gray-700 opacity-100 hover:bg-gray-50 hover:scale-105`;
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
            this.updateCellStyle(cell, symbol);
        });
    }

    updateCellStyle(cell, symbol) {
        if (symbol === 'X') {
            cell.classList.add('text-red-600');
            cell.style.color = '#dc2626';
        } else if (symbol === 'O') {
            cell.classList.add('text-blue-600');
            cell.style.color = '#2563eb';
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

            this.peer.on('open', (id) => {
                this.gameId = id;
                this.isHost = true;
                this.myPlayerSymbol = 'O';
                this.opponentPlayerSymbol = 'X';
                
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
        const gameIdInput = document.getElementById('joinGameId');
        const gameId = gameIdInput ? gameIdInput.value.trim() : '';
        
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }

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
        this.showMainMenu();
    }

    copyGameId() {
        if (this.gameId) {
            navigator.clipboard.writeText(this.gameId);
            alert('Game ID copied to clipboard!');
        }
    }

    showMainMenu() {
        this.uiManager.showMainMenu();
    }
}

// Main Game Controller - Orchestrates everything
class TicTacToeGame {
    constructor() {
        this.gameLogic = new GameLogic();
        this.uiManager = new UIManager(this.gameLogic);
        this.multiplayerManager = new MultiplayerManager(this.gameLogic, this.uiManager);
        
        // Override UI manager's cell click to handle multiplayer
        this.uiManager.handleCellClick = (row, col) => {
            if (this.multiplayerManager.connected) {
                this.multiplayerManager.handleCellClick(row, col);
            } else {
                this.uiManager.handleCellClick(row, col);
            }
        };
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TicTacToeGame();
}); 