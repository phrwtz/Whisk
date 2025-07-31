# GitHub Setup Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com/phorwitz
2. Click "New" to create a new repository
3. Name it `multiplayer-tictactoe` (or any name you prefer)
4. Make it **Public** (required for GitHub Pages)
5. **Don't** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/phorwitz/multiplayer-tictactoe.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section (in the left sidebar)
4. Under "Source", select "Deploy from a branch"
5. Under "Branch", select "main" and "/(root)"
6. Click "Save"

## Step 4: Share Your Game

Your game will be available at:
`https://phorwitz.github.io/multiplayer-tictactoe/`

## How to Play Multiplayer

1. **Host a Game**:
   - Open the game in your browser
   - Click "Host Game"
   - Copy the Game ID and share it with a friend

2. **Join a Game**:
   - Open the game in your browser
   - Click "Join Game"
   - Enter the Game ID from your friend
   - Click "Join"

3. **Local Play**:
   - Click "Play Local" for single-player mode

## Features

- ✅ Peer-to-peer multiplayer using WebRTC
- ✅ No server required
- ✅ Real-time game synchronization
- ✅ Customizable board sizes (3x3 to 8x8)
- ✅ Symbol persistence mechanics
- ✅ Scoring system
- ✅ Visual fading effects
- ✅ Mobile responsive design

## Troubleshooting

- **WebRTC requires HTTPS**: GitHub Pages provides this automatically
- **Connection issues**: Make sure both players are using modern browsers
- **Game ID not working**: Ensure the ID is copied exactly as shown 