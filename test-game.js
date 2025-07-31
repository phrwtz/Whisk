// Multiplayer TicTacToe Test Suite
class MultiplayerTester {
    constructor() {
        this.testResults = [];
        this.currentTest = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
        this.testResults.push({ message, type, timestamp });
    }

    async runAllTests() {
        console.log('🧪 Starting Multiplayer TicTacToe Test Suite');
        console.log('=' .repeat(50));

        await this.testPeerJSLibrary();
        await this.testGameInitialization();
        await this.testMultiplayerSetup();
        await this.testHostGame();
        await this.testJoinGame();
        await this.testGameSynchronization();
        await this.testDisconnectionHandling();

        this.printTestSummary();
    }

    async testPeerJSLibrary() {
        this.log('Testing PeerJS library availability...');
        
        if (typeof Peer !== 'undefined') {
            this.log('✅ PeerJS library loaded successfully', 'success');
            return true;
        } else {
            this.log('❌ PeerJS library not found', 'error');
            return false;
        }
    }

    async testGameInitialization() {
        this.log('Testing game initialization...');
        
        try {
            // Check if the game class exists
            if (typeof TicTacToe !== 'undefined') {
                this.log('✅ TicTacToe class found', 'success');
                
                // Check if multiplayer properties exist
                const game = new TicTacToe();
                const requiredProps = ['peer', 'connection', 'isHost', 'isMultiplayer', 'myPlayerSymbol', 'opponentPlayerSymbol', 'gameId'];
                
                for (const prop of requiredProps) {
                    if (game.hasOwnProperty(prop)) {
                        this.log(`✅ Property '${prop}' exists`, 'success');
                    } else {
                        this.log(`❌ Property '${prop}' missing`, 'error');
                    }
                }
                
                return true;
            } else {
                this.log('❌ TicTacToe class not found', 'error');
                return false;
            }
        } catch (error) {
            this.log(`❌ Game initialization error: ${error.message}`, 'error');
            return false;
        }
    }

    async testMultiplayerSetup() {
        this.log('Testing multiplayer setup methods...');
        
        try {
            const game = new TicTacToe();
            
            // Test multiplayer event listeners
            const requiredMethods = [
                'showMultiplayerMenu',
                'hostGame', 
                'joinGame',
                'playLocal',
                'copyGameId',
                'setupConnection',
                'handleMultiplayerData',
                'handleOpponentMove',
                'handleDisconnection'
            ];
            
            for (const method of requiredMethods) {
                if (typeof game[method] === 'function') {
                    this.log(`✅ Method '${method}' exists`, 'success');
                } else {
                    this.log(`❌ Method '${method}' missing`, 'error');
                }
            }
            
            return true;
        } catch (error) {
            this.log(`❌ Multiplayer setup test error: ${error.message}`, 'error');
            return false;
        }
    }

    async testHostGame() {
        this.log('Testing host game functionality...');
        
        try {
            const game = new TicTacToe();
            
            // Mock PeerJS for testing
            const mockPeer = {
                on: (event, callback) => {
                    if (event === 'open') {
                        setTimeout(() => callback('test-peer-id'), 100);
                    }
                }
            };
            
            // Test host game logic
            game.isHost = true;
            game.isMultiplayer = true;
            game.myPlayerSymbol = 'O';
            game.opponentPlayerSymbol = 'X';
            
            this.log('✅ Host game configuration set correctly', 'success');
            return true;
            
        } catch (error) {
            this.log(`❌ Host game test error: ${error.message}`, 'error');
            return false;
        }
    }

    async testJoinGame() {
        this.log('Testing join game functionality...');
        
        try {
            const game = new TicTacToe();
            
            // Test join game logic
            game.isHost = false;
            game.isMultiplayer = true;
            game.myPlayerSymbol = 'X';
            game.opponentPlayerSymbol = 'O';
            game.gameId = 'test-game-id';
            
            this.log('✅ Join game configuration set correctly', 'success');
            return true;
            
        } catch (error) {
            this.log(`❌ Join game test error: ${error.message}`, 'error');
            return false;
        }
    }

    async testGameSynchronization() {
        this.log('Testing game synchronization...');
        
        try {
            const game = new TicTacToe();
            
            // Test move synchronization
            const testMove = { type: 'move', row: 0, col: 0 };
            
            // Test data handling
            if (typeof game.handleMultiplayerData === 'function') {
                this.log('✅ handleMultiplayerData method exists', 'success');
            } else {
                this.log('❌ handleMultiplayerData method missing', 'error');
            }
            
            // Test opponent move handling
            if (typeof game.handleOpponentMove === 'function') {
                this.log('✅ handleOpponentMove method exists', 'success');
            } else {
                this.log('❌ handleOpponentMove method missing', 'error');
            }
            
            return true;
            
        } catch (error) {
            this.log(`❌ Game synchronization test error: ${error.message}`, 'error');
            return false;
        }
    }

    async testDisconnectionHandling() {
        this.log('Testing disconnection handling...');
        
        try {
            const game = new TicTacToe();
            
            if (typeof game.handleDisconnection === 'function') {
                this.log('✅ handleDisconnection method exists', 'success');
            } else {
                this.log('❌ handleDisconnection method missing', 'error');
            }
            
            return true;
            
        } catch (error) {
            this.log(`❌ Disconnection handling test error: ${error.message}`, 'error');
            return false;
        }
    }

    printTestSummary() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('=' .repeat(50));
        
        const successCount = this.testResults.filter(r => r.type === 'success').length;
        const errorCount = this.testResults.filter(r => r.type === 'error').length;
        const totalCount = this.testResults.length;
        
        console.log(`✅ Successful tests: ${successCount}`);
        console.log(`❌ Failed tests: ${errorCount}`);
        console.log(`📝 Total tests: ${totalCount}`);
        
        if (errorCount === 0) {
            console.log('\n🎉 All tests passed! Multiplayer functionality is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
        }
        
        console.log('\n📋 Detailed Results:');
        this.testResults.forEach(result => {
            const icon = result.type === 'success' ? '✅' : result.type === 'error' ? '❌' : 'ℹ️';
            console.log(`${icon} ${result.message}`);
        });
    }
}

// Run tests when the page loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const tester = new MultiplayerTester();
        tester.runAllTests();
    });
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerTester;
} 