# 🌊 aduu - Ephemeral Chat Application

A modern, professional chat application where conversations are truly ephemeral — no logs, no database, no tracking. Messages exist only in memory and vanish when the last person leaves.

## ✨ Features

- **Truly Ephemeral** — No database, no logs, no message persistence. Everything lives only in server memory.
- **Real-time** — WebSocket-powered instant messaging with typing indicators.
- **Rooms** — Create or join any room by name. Share the link to invite others.
- **Professional UI** — Dark/light theme, responsive design, keyboard shortcuts, notifications.
- **Privacy First** — No accounts, no tracking, no analytics. Just chat.
- **Zero Config** — Single command to run. Works locally or on any Node.js host.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies (one time)
npm install

# Start the server
npm start
```

Open http://localhost:3000 in your browser. Open multiple tabs/windows to test multi-user chat.

### Windows One-Click

Double-click `start.bat` — it installs dependencies and starts the server automatically.

## 🚂 Deploy to Railway (Free)

Railway is the easiest — no Docker, no config files needed.

### Method 1: GitHub → Railway (Recommended)

1. **Push this folder to GitHub:**
   - Create new repo at github.com/new
   - Upload all files from this `aduu` folder
   - **Important:** Include the `public/` folder with index.html, styles.css, app.js

2. **Deploy on Railway:**
   - Go to railway.app → "New Project" → "Deploy from GitHub repo"
   - Select your `aduu` repo
   - Railway auto-detects Node.js, runs `npm install` → `npm start`
   - Done! You get a URL like `https://aduu-xyz.up.railway.app`

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port (Railway sets this automatically) |
| `NODE_ENV` | production | Environment mode |

## 💰 Railway Free Tier

- **500 hours/month** (renews monthly, not a trial)
- **Auto-sleeps** after inactivity, wakes on request
- **Custom domains** supported
- **No credit card** required

Perfect for personal/small team use.

## 📁 Project Structure

```
aduu/
├── server.js          # Node.js + Socket.IO server
├── package.json       # Dependencies & scripts
├── .gitignore         # Git ignore rules
├── start.bat          # Windows one-click launcher
├── README.md          # This file
└── public/
    ├── index.html     # Main HTML
    ├── styles.css     # Complete design system
    └── app.js         # Client-side application
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Ctrl/Cmd + K` | Focus message input |
| `Ctrl/Cmd + /` | Open settings |
| `Escape` | Close modal/sidebar |

## 🔧 How It Works

- **Server**: Express + Socket.IO (WebSocket)
- **Client**: Vanilla JS, no build step
- **Storage**: In-memory Maps (ephemeral)
- **Rooms**: Dynamic, created on first join
- **Cleanup**: Empty rooms deleted after 5 minutes

## 🌐 Sharing Your Room

1. Start the server (local or deployed)
2. Share your URL: `https://your-app.railway.app/?room=myroom`
3. Anyone with the link joins the same room instantly

## 🛡️ Privacy & Security

- **No database** — Messages never touch disk
- **No logging** — Server logs only connection events
- **No analytics** — Zero tracking, zero cookies
- **Ephemeral by design** — Room data deleted 5 minutes after last user leaves
- **CORS open** — Configure for production if needed

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires WebSocket support (all modern browsers).

## 🎨 Customization

The design system uses CSS custom properties. Key variables in `public/styles.css`:

```css
:root {
  --accent-primary: #06b6d4;    /* Brand color */
  --bg-primary: #0a0f1a;        /* Background */
  --font-sans: 'Space Grotesk'; /* UI font */
  --radius-lg: 16px;            /* Roundness */
}
```

## 📄 License

MIT — Use freely for personal or commercial projects.

---

**Built with:** Node.js, Express, Socket.IO, vanilla JS/CSS  
**Philosophy:** Less infrastructure, more conversation