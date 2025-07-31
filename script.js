class TicTacToe {
    constructor() {
        this.boardSize = 8;
        this.persistence = 5;
        this.board = [];
        this.currentPlayer = 'O';
        this.gameActive = false;
        this.winningCells = [];
        this.symbolHistory = []; // Track symbols in order of placement
        this.symbolCounts = { O: 0, X: 0 };
        this.scores = { O: 0, X: 0 };
        
        // Multiplayer properties
        this.peer = null;
        this.connection = null;
        this.isHost = false;
        this.isMultiplayer = false;
        this.myPlayerSymbol = 'O'; // Host is always O
        this.opponentPlayerSymbol = 'X'; // Guest is always X
        this.gameId = null;
        this.connected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.connectionTimeout = null;
        
        this.initializeEventListeners();
        this.initializeMultiplayerEventListeners();
        
        // Check for existing game on page load
        this.checkForExistingGame();
    }

    initializeEventListeners() {
        // Setup event listeners - only for elements that exist in the new interface
        const newGameBtn = document.getElementById('newGame');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.newGame());
        }
    }

    initializeMultiplayerEventListeners() {
        // Multiplayer setup event listeners - only for elements that exist in the new interface
        const copyGameIdBtn = document.getElementById('copyGameId');
        if (copyGameIdBtn) {
            copyGameIdBtn.addEventListener('click', () => this.copyGameId());
        }
        
        // Add event listeners for multiplayer buttons - updated for new interface
        const hostGameBtn = document.getElementById('hostGameBtn');
        if (hostGameBtn) {
            hostGameBtn.addEventListener('click', () => this.hostGame());
        }
        
        const joinGameBtn = document.getElementById('joinGameBtn');
        if (joinGameBtn) {
            joinGameBtn.addEventListener('click', () => this.showJoinInterface());
        }
        
        const playLocalBtn = document.getElementById('playLocalBtn');
        if (playLocalBtn) {
            playLocalBtn.addEventListener('click', () => this.playLocal());
        }
        
        const connectToGameBtn = document.getElementById('joinGame');
        if (connectToGameBtn) {
            connectToGameBtn.addEventListener('click', () => this.joinGame());
        }
        
        const resetSetupBtn = document.getElementById('resetSetup');
        if (resetSetupBtn) {
            resetSetupBtn.addEventListener('click', () => this.showSetup());
        }
        
        const backToMultiplayerBtn = document.getElementById('backToMultiplayer');
        if (backToMultiplayerBtn) {
            backToMultiplayerBtn.addEventListener('click', () => this.showMultiplayerMenu());
        }
        
        // Add back to menu buttons
        const backToMenuBtn = document.getElementById('backToMenu');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => this.showMultiplayerMenu());
        }
        
        const backToMenuFromJoinBtn = document.getElementById('backToMenuFromJoin');
        if (backToMenuFromJoinBtn) {
            backToMenuFromJoinBtn.addEventListener('click', () => this.showMultiplayerMenu());
        }
    }

    showMultiplayerMenu() {
        console.log('showMultiplayerMenu called');
        
        // Clear any existing game data when returning to main menu
        this.clearGameData();
        
        const mainMenu = document.getElementById('mainMenu');
        const hostInterface = document.getElementById('hostInterface');
        const joinInterface = document.getElementById('joinInterface');
        const gameInterface = document.getElementById('gameInterface');
        
        console.log('Elements found:', {
            mainMenu: !!mainMenu,
            hostInterface: !!hostInterface,
            joinInterface: !!joinInterface,
            gameInterface: !!gameInterface
        });
        
        if (mainMenu) mainMenu.classList.remove('hidden');
        if (hostInterface) hostInterface.classList.add('hidden');
        if (joinInterface) joinInterface.classList.add('hidden');
        if (gameInterface) gameInterface.classList.add('hidden');
        console.log('showMultiplayerMenu completed');
    }

    hostGame() {
        console.log('Hosting game...');
        this.isHost = true;
        this.isMultiplayer = true;
        this.myPlayerSymbol = 'O';
        this.opponentPlayerSymbol = 'X';
        
        // Show loading state
        const hostGameBtn = document.getElementById('hostGameBtn');
        const connectionStatus = document.getElementById('connectionStatus');
        if (hostGameBtn) {
            hostGameBtn.disabled = true;
            hostGameBtn.textContent = 'Creating Game...';
        }
        if (connectionStatus) {
            connectionStatus.textContent = 'Initializing game server...';
            connectionStatus.className = 'text-sm font-semibold mb-4 text-blue-600';
        }
        
        // Initialize PeerJS with better error handling
        this.peer = new Peer({
            debug: 2, // Enable debug logging
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
            const hostGameId = document.getElementById('hostGameId');
            const hostInterface = document.getElementById('hostInterface');
            const connectionStatus = document.getElementById('connectionStatus');
            
            if (hostGameId) hostGameId.value = id;
            if (hostInterface) hostInterface.classList.remove('hidden');
            if (connectionStatus) {
                connectionStatus.textContent = 'Game created! Share your Game ID with a friend to start playing.';
                connectionStatus.className = 'text-sm font-semibold mb-4 text-green-600';
            }
            
            // Store game info when hosting
            localStorage.setItem('activeGameId', id);
            localStorage.setItem('activeGameHost', window.location.href);
            localStorage.setItem('gameCreatedTime', Date.now().toString());
            
            // Re-enable host button
            if (hostGameBtn) {
                hostGameBtn.disabled = false;
                hostGameBtn.textContent = 'Host Game';
            }
            
            console.log('Host game created with ID:', id);
        });
        
        this.peer.on('connection', (conn) => {
            this.connection = conn;
            this.setupConnection();
            const connectionStatus = document.getElementById('connectionStatus');
            if (connectionStatus) {
                connectionStatus.textContent = 'Player connected! Starting game...';
                connectionStatus.className = 'text-sm font-semibold mb-4 text-green-600';
            }
            console.log('Player connected to host game!');
            
            // Start the game automatically with default settings
            setTimeout(() => {
                this.startGameWithDefaults();
            }, 1000);
        });
        
        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            const connectionStatus = document.getElementById('connectionStatus');
            if (connectionStatus) {
                let errorMessage = 'Connection error: ';
                if (err.type === 'peer-unavailable') {
                    errorMessage += 'Unable to create game. Please try again.';
                } else if (err.type === 'network') {
                    errorMessage += 'Network error. Please check your internet connection.';
                } else {
                    errorMessage += err.type || 'Unknown error';
                }
                connectionStatus.textContent = errorMessage;
                connectionStatus.className = 'text-sm font-semibold mb-4 text-red-600';
            }
            
            // Re-enable host button on error
            if (hostGameBtn) {
                hostGameBtn.disabled = false;
                hostGameBtn.textContent = 'Host Game';
            }
        });
    }

    showJoinInterface() {
        const mainMenu = document.getElementById('mainMenu');
        const hostInterface = document.getElementById('hostInterface');
        const joinInterface = document.getElementById('joinInterface');
        const gameInterface = document.getElementById('gameInterface');
        
        if (mainMenu) mainMenu.classList.add('hidden');
        if (hostInterface) hostInterface.classList.add('hidden');
        if (joinInterface) joinInterface.classList.remove('hidden');
        if (gameInterface) gameInterface.classList.add('hidden');
    }

    joinGame() {
        const joinGameId = document.getElementById('joinGameId');
        const joinStatus = document.getElementById('joinStatus');
        const connectToGameBtn = document.getElementById('connectToGame');
        
        const gameId = joinGameId ? joinGameId.value.trim() : '';
        if (!gameId) {
            if (joinStatus) {
                joinStatus.textContent = 'Please enter a game ID';
                joinStatus.className = 'text-sm font-semibold mb-4 text-red-600';
            }
            return;
        }
        
        // Show loading state
        if (connectToGameBtn) {
            connectToGameBtn.disabled = true;
            connectToGameBtn.textContent = 'Connecting...';
        }
        if (joinStatus) {
            joinStatus.textContent = 'Initializing connection...';
            joinStatus.className = 'text-sm font-semibold mb-4 text-blue-600';
        }
        
        console.log('Joining game:', gameId);
        this.isHost = false;
        this.isMultiplayer = true;
        this.myPlayerSymbol = 'X';
        this.opponentPlayerSymbol = 'O';
        this.gameId = gameId;
        
        // Initialize PeerJS with better configuration
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
            if (joinStatus) {
                joinStatus.textContent = 'Connecting to game...';
                joinStatus.className = 'text-sm font-semibold mb-4 text-blue-600';
            }
            
            console.log('Connecting to game:', gameId);
            
            // Connect to the host
            this.connection = this.peer.connect(gameId, {
                reliable: true,
                serialization: 'json'
            });
            this.setupConnection();
            
            // Add timeout for connection
            this.connectionTimeout = setTimeout(() => {
                if (!this.connected) {
                    console.log('Connection timeout');
                    if (joinStatus) {
                        joinStatus.textContent = 'Connection timeout. Please check the Game ID and try again.';
                        joinStatus.className = 'text-sm font-semibold mb-4 text-red-600';
                    }
                    if (connectToGameBtn) {
                        connectToGameBtn.disabled = false;
                        connectToGameBtn.textContent = 'Join';
                    }
                    this.cleanupConnection();
                }
            }, 15000); // 15 second timeout
        });
        
        this.peer.on('error', (err) => {
            console.error('PeerJS error:', err);
            if (joinStatus) {
                let errorMessage = 'Connection error: ';
                if (err.type === 'peer-unavailable') {
                    errorMessage += 'Game not found or host disconnected. Please check the Game ID and try again.';
                } else if (err.type === 'network') {
                    errorMessage += 'Network error. Please check your internet connection.';
                } else {
                    errorMessage += err.type || 'Unknown error';
                }
                joinStatus.textContent = errorMessage;
                joinStatus.className = 'text-sm font-semibold mb-4 text-red-600';
            }
            
            if (connectToGameBtn) {
                connectToGameBtn.disabled = false;
                connectToGameBtn.textContent = 'Join';
            }
            
            this.cleanupConnection();
        });
    }

    setupConnection() {
        this.connection.on('open', () => {
            this.connected = true;
            this.connectionAttempts = 0;
            
            // Clear timeout
            if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = null;
            }
            
            const joinStatus = document.getElementById('joinStatus');
            const connectToGameBtn = document.getElementById('connectToGame');
            
            if (joinStatus) {
                joinStatus.textContent = 'Connected! Starting game...';
                joinStatus.className = 'text-sm font-semibold mb-4 text-green-600';
            }
            if (connectToGameBtn) {
                connectToGameBtn.disabled = false;
                connectToGameBtn.textContent = 'Join';
            }
            
            console.log('Connection established successfully!');
            
            // Start the game automatically with default settings
            setTimeout(() => {
                this.startGameWithDefaults();
            }, 1000);
        });
        
        this.connection.on('data', (data) => {
            this.handleMultiplayerData(data);
        });
        
        this.connection.on('close', () => {
            console.log('Connection closed');
            this.connected = false;
            this.handleDisconnection();
        });
        
        this.connection.on('error', (err) => {
            console.error('Connection error:', err);
            const joinStatus = document.getElementById('joinStatus');
            if (joinStatus) {
                joinStatus.textContent = 'Failed to connect to host. Please check the Game ID and try again.';
                joinStatus.className = 'text-sm font-semibold mb-4 text-red-600';
            }
            this.cleanupConnection();
        });
    }

    startGameWithDefaults() {
        console.log('Starting game with defaults');
        
        // Prevent multiple initializations
        if (this.gameActive) {
            console.log('Game already active, skipping initialization');
            return;
        }
        
        // Set default values
        this.boardSize = 8;
        this.persistence = 5;
        
        // Update the UI elements to match defaults
        const boardSizeSelect = document.getElementById('boardSize');
        const persistenceSelect = document.getElementById('persistence');
        if (boardSizeSelect) boardSizeSelect.value = '8';
        if (persistenceSelect) persistenceSelect.value = '5';
        
        console.log('Defaults set - boardSize:', this.boardSize, 'persistence:', this.persistence);
        
        // Start the game directly
        this.startGame();
    }

    handleMultiplayerData(data) {
        switch (data.type) {
            case 'gameStart':
                // Both players should use the same default settings
                this.boardSize = data.boardSize || 8;
                this.persistence = data.persistence || 5;
                this.startGame();
                break;
            case 'move':
                this.handleOpponentMove(data.row, data.col);
                break;
            case 'newGame':
                console.log('Received newGame signal from opponent');
                this.handleNewGameFromOpponent();
                break;
            case 'boardSync':
                this.syncBoard(data.board, data.scores, data.currentPlayer, data.symbolHistory);
                break;
        }
    }

    handleNewGameFromOpponent() {
        console.log('Handling new game from opponent');
        
        this.initializeBoard();
        this.gameActive = true;
        this.currentPlayer = 'O';
        this.winningCells = [];
        this.symbolHistory = [];
        this.symbolCounts = { O: 0, X: 0 };
        this.scores = { O: 0, X: 0 };
        
        // Clear all cells completely
        const cells = document.querySelectorAll('.cell, button[data-row]');
        cells.forEach(cell => {
            cell.textContent = '';
            const cellSizeClass = `cell-${this.boardSize}x${this.boardSize}`;
            cell.className = `${cellSizeClass} bg-white border-none rounded-lg font-bold cursor-pointer transition-all duration-300 flex items-center justify-center text-gray-700 opacity-100 hover:bg-gray-50 hover:scale-105`;
            // Clear all inline styles including background color
            cell.style.fontSize = '';
            cell.style.opacity = '';
            cell.style.fontWeight = '';
            cell.style.backgroundColor = '';
        });
        
        // Clear the scoring textbox
        const gameStatus = document.getElementById('gameStatus');
        if (gameStatus) {
            gameStatus.textContent = '';
        }
        
        // Update turn messages for multiplayer
        if (this.isMultiplayer) {
            this.updateTurnMessages();
        }
        
        this.updateGameDisplay();
    }

    handleOpponentMove(row, col) {
        if (this.currentPlayer === this.myPlayerSymbol) {
            // It's not my turn, ignore
            return;
        }
        
        console.log('Handling opponent move:', row, col);
        
        // Make the opponent's move
        this.board[row][col] = this.opponentPlayerSymbol;
        this.symbolCounts[this.opponentPlayerSymbol]++;
        
        // Add to history
        this.symbolHistory.push({
            symbol: this.opponentPlayerSymbol,
            row: row,
            col: col,
            timestamp: Date.now()
        });
        
        // Manage persistence
        this.managePersistence();
        
        this.updateCellDisplay(row, col);
        this.updateAllFadingEffects();
        
        // Check for scoring
        const scoringResult = this.checkScoring(row, col);
        const pointsEarned = scoringResult.totalPoints;
        const scoringCells = scoringResult.scoringCells;
        
        if (pointsEarned > 0) {
            this.scores[this.opponentPlayerSymbol] += pointsEarned;
            this.updateScoreDisplay();
            this.showScoringMessage(pointsEarned, this.opponentPlayerSymbol);
            
            if (scoringCells.length > 0) {
                const cellElements = scoringCells.map(cell => 
                    document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`)
                ).filter(cell => cell !== null);
                this.flashWinningCells(cellElements);
            }
        } else {
            // No points scored, just update turn message
            this.updateTurnMessages();
        }
        
        // Don't switch players here - it's already been switched by the player who made the move
        console.log('Opponent move completed, current player is now:', this.currentPlayer);
        
        // Update score display but don't override scoring messages
        this.updateScoreDisplay();
        
        // Only update turn message if there's no scoring message currently displayed
        const gameStatus = document.getElementById('gameStatus');
        if (this.isMultiplayer && gameStatus && !gameStatus.textContent.includes('scored')) {
            this.updateTurnMessages();
        }
    }

    syncBoard(board, scores, currentPlayer, symbolHistory) {
        console.log('Syncing board state - received currentPlayer:', currentPlayer, 'my symbol:', this.myPlayerSymbol);
        console.log('Before sync - this.currentPlayer:', this.currentPlayer);
        this.board = board;
        this.scores = scores;
        this.currentPlayer = currentPlayer;
        this.symbolHistory = symbolHistory;
        console.log('After sync - this.currentPlayer:', this.currentPlayer);
        
        // Update symbol counts
        this.symbolCounts = { O: 0, X: 0 };
        this.symbolHistory.forEach(symbol => {
            this.symbolCounts[symbol.symbol]++;
        });
        
        // Update display
        this.updateAllFadingEffects();
        this.updateScoreDisplay();
        this.updateGameDisplay();
        
        // Update all cells
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.updateCellDisplay(row, col);
            }
        }
        
        // Update turn messages for multiplayer
        if (this.isMultiplayer) {
            const gameStatus = document.getElementById('gameStatus');
            if (gameStatus && !gameStatus.textContent.includes('scored')) {
                this.updateTurnMessages();
            }
        }
    }

    handleDisconnection() {
        if (this.isMultiplayer) {
            this.showScoringMessage('Opponent disconnected', '');
            this.gameActive = false;
            
            // Clear game data when game ends
            this.clearGameData();
            
            // Show reconnection option
            const gameStatus = document.getElementById('gameStatus');
            if (gameStatus) {
                gameStatus.innerHTML = `
                    <div class="text-red-600 font-bold mb-2">Opponent disconnected</div>
                    <button onclick="location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        Return to Menu
                    </button>
                `;
            }
        }
    }

    copyGameId() {
        const gameIdInput = document.getElementById('hostGameId');
        gameIdInput.select();
        document.execCommand('copy');
        
        const copyButton = document.getElementById('copyGameId');
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
            copyButton.textContent = originalText;
        }, 2000);
    }

    playLocal() {
        this.isMultiplayer = false;
        
        // Show game interface
        const mainMenu = document.getElementById('mainMenu');
        const hostInterface = document.getElementById('hostInterface');
        const joinInterface = document.getElementById('joinInterface');
        const gameInterface = document.getElementById('gameInterface');
        
        if (mainMenu) mainMenu.classList.add('hidden');
        if (hostInterface) hostInterface.classList.add('hidden');
        if (joinInterface) joinInterface.classList.add('hidden');
        if (gameInterface) gameInterface.classList.remove('hidden');
        
        // Expand container for game interface
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.classList.remove('max-w-md');
            mainContainer.classList.add('max-w-7xl', 'w-full');
        }
        
        // Start the game directly
        this.startGameWithDefaults();
    }

    autoStartGame() {
        // Set the UI elements to 8x8 and 5 symbols
        const boardSizeSelect = document.getElementById('boardSize');
        const persistenceSelect = document.getElementById('persistence');
        
        if (boardSizeSelect) boardSizeSelect.value = '8';
        if (persistenceSelect) persistenceSelect.value = '5';
        
        // Start the game automatically
        this.startGame();
    }

    startGame() {
        // Prevent multiple game starts
        if (this.gameActive) {
            console.log('Game already active, skipping start');
            return;
        }
        
        const boardSizeSelect = document.getElementById('boardSize');
        const persistenceSelect = document.getElementById('persistence');
        
        this.boardSize = boardSizeSelect ? parseInt(boardSizeSelect.value) : 8;
        this.persistence = persistenceSelect ? parseInt(persistenceSelect.value) : 5;
        
        console.log('Starting game with boardSize:', this.boardSize, 'persistence:', this.persistence);
        
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
        
        console.log('Game initialized - gameActive:', this.gameActive, 'currentPlayer:', this.currentPlayer);
        
        // Clear the scoring textbox
        const gameStatus = document.getElementById('gameStatus');
        if (gameStatus) {
            gameStatus.textContent = '';
        }
        
        // Show game interface
        const mainMenu = document.getElementById('mainMenu');
        const hostInterface = document.getElementById('hostInterface');
        const joinInterface = document.getElementById('joinInterface');
        const gameInterface = document.getElementById('gameInterface');
        
        if (mainMenu) mainMenu.classList.add('hidden');
        if (hostInterface) hostInterface.classList.add('hidden');
        if (joinInterface) joinInterface.classList.add('hidden');
        if (gameInterface) gameInterface.classList.remove('hidden');
        
        // Expand container for game interface
        const mainContainer = document.getElementById('mainContainer');
        if (mainContainer) {
            mainContainer.classList.remove('max-w-md');
            mainContainer.classList.add('max-w-7xl', 'w-full');
        }
        
        // Show multiplayer info if in multiplayer mode
        if (this.isMultiplayer) {
            const userInfo = document.getElementById('userInfo');
            const userSymbol = document.getElementById('userSymbol');
            if (userInfo && userSymbol) {
                userSymbol.textContent = this.myPlayerSymbol;
                userInfo.textContent = `You are ${this.isHost ? 'hosting' : 'joining'} as ${this.myPlayerSymbol}`;
            }
            console.log('Multiplayer game - Host:', this.isHost, 'My symbol:', this.myPlayerSymbol);
            
            // Set initial turn messages for multiplayer
            this.updateTurnMessages();
        } else {
            const userInfo = document.getElementById('userInfo');
            if (userInfo) {
                userInfo.textContent = 'Local Game';
            }
        }
        
        this.updateGameDisplay();
        this.createBoard();
        
        // Send game start data to opponent if multiplayer (only host sends it)
        if (this.isMultiplayer && this.connection && this.isHost) {
            this.connection.send({
                type: 'gameStart',
                boardSize: this.boardSize,
                persistence: this.persistence
            });
        }
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
        gameBoard.className = 'grid gap-1 bg-green-500 p-2 rounded-2xl shadow-2xl';
        if (this.boardSize === 3) {
            gameBoard.classList.add('board-3x3');
        }
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                const cell = document.createElement('button');
                // Use responsive cell sizing based on board size
                const cellSizeClass = `cell-${this.boardSize}x${this.boardSize}`;
                cell.className = `${cellSizeClass} bg-white border-none rounded-lg font-bold cursor-pointer transition-all duration-300 flex items-center justify-center text-gray-700 opacity-100 hover:bg-gray-50 hover:scale-105`;
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', () => this.handleCellClick(i, j));
                gameBoard.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        console.log('Cell clicked:', row, col);
        console.log('Game active:', this.gameActive);
        console.log('Cell empty:', this.board[row][col] === '');
        console.log('Multiplayer:', this.isMultiplayer);
        console.log('Current player:', this.currentPlayer);
        console.log('My symbol:', this.myPlayerSymbol);
        console.log('Is it my turn?', this.currentPlayer === this.myPlayerSymbol);
        
        if (!this.gameActive || this.board[row][col] !== '') {
            console.log('Game not active or cell not empty');
            return;
        }

        // In multiplayer mode, only allow moves on your turn
        if (this.isMultiplayer && this.currentPlayer !== this.myPlayerSymbol) {
            console.log('Not my turn in multiplayer - current:', this.currentPlayer, 'my symbol:', this.myPlayerSymbol);
            return;
        }
        
        console.log('Move allowed - proceeding with move');

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
        } else {
            // No points scored, update turn message
            if (this.isMultiplayer) {
                this.updateTurnMessages();
            }
        }

        // Send move to opponent if in multiplayer mode
        if (this.isMultiplayer && this.connection) {
            // Switch players BEFORE sending the move
            this.currentPlayer = this.currentPlayer === 'O' ? 'X' : 'O';
            console.log('Switched to player:', this.currentPlayer);
            
            this.connection.send({
                type: 'move',
                row: row,
                col: col
            });
            
            // Send full board sync with updated current player
            this.connection.send({
                type: 'boardSync',
                board: this.board,
                scores: this.scores,
                currentPlayer: this.currentPlayer,
                symbolHistory: this.symbolHistory
            });
        } else {
            // Switch players for local game
            this.currentPlayer = this.currentPlayer === 'O' ? 'X' : 'O';
            console.log('Switched to player:', this.currentPlayer);
        }
        
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
            const cellSizeClass = `cell-${this.boardSize}x${this.boardSize}`;
            cell.className = `${cellSizeClass} bg-white border-none rounded-lg font-bold cursor-pointer transition-all duration-300 flex items-center justify-center text-gray-700 opacity-100 hover:bg-gray-50 hover:scale-105`;
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
        const cells = document.querySelectorAll('.cell, button[data-row]');
        cells.forEach(cell => {
            // Remove only fade classes, preserve other classes including text colors
            const currentClasses = cell.className.split(' ');
            const preservedClasses = currentClasses.filter(cls => !cls.startsWith('fade-'));
            cell.className = preservedClasses.join(' ');
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
                    
                    // Ensure text color is preserved with high specificity
                    if (symbolData.symbol === 'X') {
                        cell.classList.add('text-red-600');
                        cell.style.color = '#dc2626'; // Red color with !important equivalent
                    } else if (symbolData.symbol === 'O') {
                        cell.classList.add('text-blue-600');
                        cell.style.color = '#2563eb'; // Blue color with !important equivalent
                    }
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
        if (!cell) return;
        
        cell.textContent = this.board[row][col];
        
        // Remove existing player classes and add the new one
        cell.classList.remove('text-red-600', 'text-blue-600');
        if (this.board[row][col]) {
            if (this.board[row][col] === 'X') {
                cell.classList.add('text-red-600');
                cell.style.color = '#dc2626'; // Red color
                console.log(`Cell (${row}, ${col}) set to red X`);
            } else if (this.board[row][col] === 'O') {
                cell.classList.add('text-blue-600');
                cell.style.color = '#2563eb'; // Blue color
                console.log(`Cell (${row}, ${col}) set to blue O`);
            }
        } else {
            // Clear color for empty cells
            cell.style.color = '';
        }
        
        // Log the initial cell state
        console.log(`Cell (${row}, ${col}) updated with symbol: ${this.board[row][col]}`);
        console.log(`Cell classes after update:`, cell.className);
        
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
        const playerSymbol = document.getElementById('playerSymbol');
        if (playerSymbol) {
            playerSymbol.textContent = this.currentPlayer;
        }
        
        // Only update turn messages if there's no scoring message currently displayed
        const gameStatus = document.getElementById('gameStatus');
        if (this.isMultiplayer && gameStatus && !gameStatus.textContent.includes('scored')) {
            this.updateTurnMessages();
        }
        
        // Don't clear the scoring message here - let it stay until next move
        // Only update the score display, don't touch the gameStatus
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        const scoreO = document.getElementById('scoreO');
        const scoreX = document.getElementById('scoreX');
        
        if (scoreO) scoreO.textContent = this.scores.O;
        if (scoreX) scoreX.textContent = this.scores.X;
    }

    showScoringMessage(points, player) {
        const gameStatus = document.getElementById('gameStatus');
        console.log('showScoringMessage called with:', points, player);
        console.log('gameStatus element:', gameStatus);
        console.log('isMultiplayer:', this.isMultiplayer, 'myPlayerSymbol:', this.myPlayerSymbol, 'opponentPlayerSymbol:', this.opponentPlayerSymbol);
        
        if (gameStatus) {
            let message;
            let textColor;
            
            // Check if this player has won (50+ points)
            if (this.scores[player] >= 50) {
                message = `${player} wins!`;
                textColor = '#e53e3e'; // Red color for win message
            } else {
                if (this.isMultiplayer) {
                    // For multiplayer, check if the scoring player is the current player
                    if (player === this.myPlayerSymbol) {
                        // I scored points
                        message = `You scored ${points} point${points !== 1 ? 's' : ''}! It is your opponent's turn.`;
                        textColor = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e'; // Blue for O, Red for X
                        console.log('Setting message for player who scored:', message);
                    } else if (player === this.opponentPlayerSymbol) {
                        // My opponent scored points
                        message = `Your opponent scored ${points} point${points !== 1 ? 's' : ''}! It is your turn.`;
                        textColor = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e'; // Blue for O, Red for X
                        console.log('Setting message for player who didn\'t score:', message);
                    } else {
                        // Fallback for unexpected player symbol
                        message = `${player} scored ${points} point${points !== 1 ? 's' : ''}!`;
                        textColor = '#3182ce'; // Default blue
                        console.log('Setting fallback message:', message);
                    }
                } else {
                    // Local game or fallback
                    message = points === 1 ? `${player} scores 1 point!` : `${player} scores ${points} points!`;
                    textColor = '#3182ce'; // Default blue
                    console.log('Setting fallback message:', message);
                }
            }
            
            gameStatus.textContent = message;
            gameStatus.style.color = textColor;
            gameStatus.style.backgroundColor = '#f0f0f0';
            gameStatus.style.padding = '10px';
            gameStatus.style.borderRadius = '5px';
            gameStatus.style.fontSize = '1.2rem';
            gameStatus.style.fontWeight = 'bold';
            gameStatus.style.border = `2px solid ${textColor}`;
            gameStatus.style.display = 'block';
            gameStatus.style.visibility = 'visible';
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
        console.log('Starting new game - multiplayer:', this.isMultiplayer, 'isHost:', this.isHost);
        
        this.initializeBoard();
        this.gameActive = true;
        this.currentPlayer = 'O';
        this.winningCells = [];
        this.symbolHistory = [];
        this.symbolCounts = { O: 0, X: 0 };
        this.scores = { O: 0, X: 0 };
        
        // Clear all cells completely
        const cells = document.querySelectorAll('.cell, button[data-row]');
        cells.forEach(cell => {
            cell.textContent = '';
            const cellSizeClass = `cell-${this.boardSize}x${this.boardSize}`;
            cell.className = `${cellSizeClass} bg-white border-none rounded-lg font-bold cursor-pointer transition-all duration-300 flex items-center justify-center text-gray-700 opacity-100 hover:bg-gray-50 hover:scale-105`;
            // Clear all inline styles including background color
            cell.style.fontSize = '';
            cell.style.opacity = '';
            cell.style.fontWeight = '';
            cell.style.backgroundColor = '';
        });
        
        // Clear the scoring textbox
        const gameStatus = document.getElementById('gameStatus');
        if (gameStatus) {
            gameStatus.textContent = '';
        }
        
        // Update turn messages for multiplayer
        if (this.isMultiplayer) {
            this.updateTurnMessages();
        }
        
        // Send new game signal to opponent if in multiplayer mode (only host sends it)
        if (this.isMultiplayer && this.connection && this.isHost) {
            console.log('Sending newGame signal to opponent');
            this.connection.send({
                type: 'newGame'
            });
        }
        
        this.updateGameDisplay();
    }

    updateTurnMessages() {
        const gameStatus = document.getElementById('gameStatus');
        if (!gameStatus) {
            console.error('gameStatus element not found for turn messages');
            return;
        }
        console.log('Updating turn messages - multiplayer:', this.isMultiplayer, 'currentPlayer:', this.currentPlayer, 'mySymbol:', this.myPlayerSymbol);
        
        let message;
        let textColor;
        
        if (this.isMultiplayer) {
            if (this.currentPlayer === this.myPlayerSymbol) {
                message = 'It is your turn';
                textColor = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e'; // Blue for O, Red for X
                console.log('Set turn message: It is your turn');
            } else {
                message = "It is your opponent's turn";
                textColor = this.myPlayerSymbol === 'O' ? '#3182ce' : '#e53e3e'; // Blue for O, Red for X
                console.log('Set turn message: It is your opponent\'s turn');
            }
        } else {
            message = `It is ${this.currentPlayer}'s turn`;
            textColor = '#3182ce'; // Default blue for local games
            console.log('Set turn message for local game:', message);
        }
        
        gameStatus.textContent = message;
        gameStatus.style.color = textColor;
        gameStatus.style.backgroundColor = '#f0f0f0';
        gameStatus.style.padding = '10px';
        gameStatus.style.borderRadius = '5px';
        gameStatus.style.fontSize = '1.2rem';
        gameStatus.style.fontWeight = 'bold';
        gameStatus.style.border = `2px solid ${textColor}`;
        gameStatus.style.display = 'block';
        gameStatus.style.visibility = 'visible';
    }

    showSetup() {
        const game = document.getElementById('game');
        const setup = document.getElementById('setup');
        const multiplayerSetup = document.getElementById('multiplayerSetup');
        
        if (game) game.classList.add('hidden');
        if (setup) setup.style.display = 'block';
        if (multiplayerSetup) multiplayerSetup.classList.add('hidden');
    }

    checkForExistingGame() {
        // Check for existing game on page load
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId');
        const isJoining = urlParams.get('join') === 'true';
        
        // Check if there's an active game (stored in localStorage)
        const activeGameId = localStorage.getItem('activeGameId');
        const activeGameHost = localStorage.getItem('activeGameHost');
        const gameCreatedTime = localStorage.getItem('gameCreatedTime');
        
        // Clear old game data (older than 1 hour)
        if (gameCreatedTime && (Date.now() - parseInt(gameCreatedTime)) > 3600000) {
            this.clearGameData();
        }
        
        // Check if there's a valid active game
        if (activeGameId && activeGameHost && gameCreatedTime) {
            // Verify the game is still recent (less than 1 hour old)
            const gameAge = Date.now() - parseInt(gameCreatedTime);
            if (gameAge < 3600000) {
                // There's a valid active game, show join interface
                this.showJoinInterface();
                const joinGameId = document.getElementById('joinGameId');
                if (joinGameId) {
                    joinGameId.value = activeGameId;
                }
                return;
            } else {
                // Game is too old, clear it
                this.clearGameData();
            }
        } else if (gameId && isJoining) {
            // Auto-join existing game from URL params
            this.showJoinInterface();
            const joinGameId = document.getElementById('joinGameId');
            if (joinGameId) {
                joinGameId.value = gameId;
            }
            this.joinGame();
        } else {
            // No active game, clear any stale data and show main menu
            this.clearGameData();
            this.showMultiplayerMenu();
        }
    }

    clearGameData() {
        localStorage.removeItem('activeGameId');
        localStorage.removeItem('activeGameHost');
        localStorage.removeItem('gameCreatedTime');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
}); 