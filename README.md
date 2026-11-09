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

### Production Deployment

```bash
# Set production environment
NODE_ENV=production npm start
```

The server runs on port 3000 by default. Configure with `PORT` environment variable.

## 💰 Hosting Costs

### Free Options (Recommended for Personal Use)

| Platform | Cost | Notes |
|----------|------|-------|
| **Railway** | Free tier | 500 hrs/month, auto-deploys from GitHub |
| **Render** | Free tier | Spins down after 15 min inactivity |
| **Fly.io** | Free allowance | 3 shared-CPU VMs, 160GB bandwidth |
| **Oracle Cloud** | Always Free | 4 ARM Ampere cores, 24GB RAM |
| **Koyeb** | Free tier | 1 service, auto-sleeps |

### Low-Cost Options ($3-7/month)

| Platform | Cost/Month | Specs |
|----------|------------|-------|
| **DigitalOcean App Platform** | $5 | 512MB RAM, auto-scaling |
| **Railway Pro** | $5 | No sleep, custom domains |
| **Hetzner VPS** | ~€4 | 2 vCPU, 4GB RAM, 40GB SSD |
| **Vultr** | $6 | 1 vCPU, 1GB RAM, 25GB SSD |

### What You Need

- **Minimum**: 128MB RAM, 0.1 vCPU (handles ~50 concurrent users)
- **Recommended**: 512MB RAM, 0.5 vCPU (handles ~200+ concurrent users)
- **Bandwidth**: ~1-5 KB per message per user

**Estimated monthly cost for personal/small team use: $0-5**

## 📁 Project Structure

```
aduu/
├── server.js          # Node.js + Socket.IO server
├── package.json       # Dependencies
├── public/
│   ├── index.html     # Main HTML
│   ├── styles.css     # Complete design system
│   └── app.js         # Client-side application
└── README.md
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Ctrl/Cmd + K` | Focus message input |
| `Ctrl/Cmd + /` | Open settings |
| `Escape` | Close modal |

## 🔧 Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |

## 🌐 Sharing Your Room

1. Start the server
2. Share your URL: `http://your-domain:3000/?room=myroom`
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

The design system uses CSS custom properties. Key variables in `styles.css`:

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