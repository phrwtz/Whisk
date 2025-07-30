# Production Setup Instructions

## Option 1: Quick Fix (Recommended for now)

The current setup uses Tailwind CSS CDN with plugins, which should work fine for most use cases. The warning is just a recommendation, not an error.

## Option 2: Proper Production Setup

If you want to set up Tailwind CSS properly for production:

### 1. Install Node.js and npm
Download and install Node.js from: https://nodejs.org/

### 2. Initialize the project
```bash
npm init -y
npm install -D tailwindcss
npx tailwindcss init
```

### 3. Create a CSS file
Create `src/input.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* Custom fade classes for symbol aging */
.fade-0 { font-weight: 900 !important; }
.fade-1 { font-weight: 800 !important; }
.fade-2 { font-weight: 700 !important; }
.fade-3 { font-weight: 600 !important; }
.fade-4 { font-weight: 500 !important; }
.fade-5 { font-weight: 400 !important; }
.fade-6 { font-weight: 300 !important; }
.fade-7 { font-weight: 200 !important; }
.fade-8 { font-weight: 100 !important; }
.fade-9 { font-weight: 100 !important; }
.fade-10 { font-weight: 100 !important; }

/* Disable hover effects for cells with fade classes */
.cell.fade-0:hover,
.cell.fade-1:hover,
.cell.fade-2:hover,
.cell.fade-3:hover,
.cell.fade-4:hover,
.cell.fade-5:hover,
.cell.fade-6:hover,
.cell.fade-7:hover,
.cell.fade-8:hover,
.cell.fade-9:hover,
.cell.fade-10:hover {
    transform: none !important;
}

/* Custom cell sizing for different board sizes */
.cell-3x3 { width: 80px; height: 80px; }
.cell-4x4 { width: 70px; height: 70px; }
.cell-5x5 { width: 60px; height: 60px; }
.cell-6x6 { width: 50px; height: 50px; }
.cell-7x7 { width: 45px; height: 45px; }
.cell-8x8 { width: 40px; height: 40px; }
```

### 4. Configure Tailwind
Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        'pulse': 'pulse 1s infinite',
      }
    },
  },
  plugins: [],
}
```

### 5. Build the CSS
Add to `package.json`:
```json
{
  "scripts": {
    "build": "tailwindcss -i ./src/input.css -o ./dist/output.css --watch"
  }
}
```

### 6. Update HTML
Replace the CDN link with:
```html
<link href="./dist/output.css" rel="stylesheet">
```

### 7. Run the build
```bash
npm run build
```

## Option 3: Use a CDN with No Warning

You can also use a different CDN that doesn't show the warning:
```html
<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
```

## Current Status

The current setup with the CDN and plugins should work fine for development and small projects. The warning is just Tailwind's way of encouraging proper setup for large production applications. 