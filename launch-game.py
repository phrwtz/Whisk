#!/usr/bin/env python3
"""
Game Launcher Script
Starts a local HTTP server and opens the Tic Tac Toe game in the browser.
"""

import http.server
import socketserver
import webbrowser
import threading
import time
import os
import sys

def start_server(port=8000):
    """Start the HTTP server on the specified port."""
    handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"🚀 Starting game server on http://localhost:{port}")
        print(f"📁 Serving files from: {os.getcwd()}")
        print(f"🌐 Game URL: http://localhost:{port}/game-launcher.html")
        print("\n" + "="*50)
        print("🎮 TIC TAC TOE MULTIPLAYER GAME")
        print("="*50)
        print("📋 Instructions:")
        print("1. First player: Click 'Host Game' and copy the Game ID")
        print("2. Second player: Click 'Join Game' and enter the Game ID")
        print("3. Both players will automatically start the game")
        print("4. Use 'Instructions' button to see game rules")
        print("="*50)
        print("⏹️  Press Ctrl+C to stop the server")
        print("="*50 + "\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped.")
            httpd.shutdown()

def open_browser(port=8000):
    """Open the game in the default browser after a short delay."""
    time.sleep(1)  # Wait for server to start
    url = f"http://localhost:{port}/game-launcher.html"
    print(f"🌐 Opening browser to: {url}")
    webbrowser.open(url)

def main():
    port = 8000
    
    # Check if port is available
    try:
        with socketserver.TCPServer(("", port), http.server.SimpleHTTPRequestHandler) as test_server:
            test_server.server_close()
    except OSError:
        print(f"❌ Port {port} is already in use!")
        print("💡 Try a different port or close the application using port 8000")
        sys.exit(1)
    
    # Start browser opening in a separate thread
    browser_thread = threading.Thread(target=open_browser, args=(port,))
    browser_thread.daemon = True
    browser_thread.start()
    
    # Start the server
    start_server(port)

if __name__ == "__main__":
    main() 