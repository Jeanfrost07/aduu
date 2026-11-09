/**
 * aduu - Ephemeral Chat Application
 * Professional, modern chat with no persistence
 */

// ========================================
// Configuration & State
// ========================================
const CONFIG = {
  maxMessageLength: 4000,
  typingTimeout: 2000,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  messageRetention: 200
};

const state = {
  socket: null,
  userId: null,
  username: null,
  roomId: 'general',
  users: new Map(),
  messages: [],
  typingUsers: new Map(),
  isConnected: false,
  isConnecting: false,
  reconnectCount: 0,
  theme: 'dark',
  settings: {
    sound: true,
    timestamps: true,
    displayName: null
  },
  unreadCount: 0,
  isFocused: true,
  scrollLocked: false
};

// DOM Elements
const els = {};

// ========================================
// Utility Functions
// ========================================

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function generateAvatarColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

function getInitials(username) {
  return username
    .split(/[\s_-]/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ========================================
// Toast Notifications
// ========================================

function showToast(type, title, message, duration = 4000) {
  const container = els.toastContainer;
  if (!container) return;

  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  const toast = createElement(`
    <div class="toast ${type}" role="alert" aria-live="polite">
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-message">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `);

  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);

  // Auto remove
  setTimeout(() => removeToast(toast), duration);

  return toast;
}

function removeToast(toast) {
  if (!toast || toast.classList.contains('removing')) return;
  toast.classList.add('removing');
  toast.addEventListener('animationend', () => toast.remove());
}

// ========================================
// Theme Management
// ========================================

function initTheme() {
  const saved = localStorage.getItem('aduu-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  state.theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(state.theme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('aduu-theme', theme);
  updateThemeIcon();
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

function updateThemeIcon() {
  // Icons are handled via CSS [data-theme] selectors
}

// ========================================
// Settings Management
// ========================================

function loadSettings() {
  const saved = localStorage.getItem('aduu-settings');
  if (saved) {
    try {
      state.settings = { ...state.settings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse settings:', e);
    }
  }
  applySettings();
}

function saveSettings() {
  localStorage.setItem('aduu-settings', JSON.stringify(state.settings));
}

function applySettings() {
  // Apply to inputs
  if (els.displayNameInput) {
    els.displayNameInput.value = state.settings.displayName || '';
  }
  if (els.roomInput) {
    els.roomInput.value = state.roomId !== 'general' ? state.roomId : '';
  }
  if (els.soundToggle) {
    els.soundToggle.checked = state.settings.sound;
  }
  if (els.timestampsToggle) {
    els.timestampsToggle.checked = state.settings.timestamps;
    document.documentElement.style.setProperty('--show-timestamps', state.settings.timestamps ? 'block' : 'none');
  }
}

// ========================================
// Socket Connection
// ========================================

function connect() {
  if (state.isConnecting || state.isConnected) return;

  state.isConnecting = true;
  updateConnectionStatus('connecting');

  // Get or create socket
  if (!state.socket) {
    state.socket = io({
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10000
    });
    setupSocketListeners();
  }

  state.socket.connect();
}

function setupSocketListeners() {
  const socket = state.socket;

  socket.on('connect', () => {
    console.log('Connected:', socket.id);
    state.isConnected = true;
    state.isConnecting = false;
    state.reconnectCount = 0;
    state.userId = socket.id;
    updateConnectionStatus('connected');
    joinRoom(state.roomId, state.username);
    showToast('success', 'Connected', 'You\'re now in the room');
  });

  socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    state.isConnected = false;
    state.isConnecting = false;
    updateConnectionStatus('disconnected');
    handleDisconnect(reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    state.isConnecting = false;
    handleConnectionError(error);
  });

  socket.on('room-state', (data) => {
    handleRoomState(data);
  });

  socket.on('new-message', (message) => {
    handleNewMessage(message);
  });

  socket.on('user-joined', (data) => {
    handleUserJoined(data);
  });

  socket.on('user-left', (data) => {
    handleUserLeft(data);
  });

  socket.on('user-typing', (data) => {
    handleUserTyping(data);
  });
}

function handleDisconnect(reason) {
  if (reason === 'io client disconnect') return; // Intentional disconnect

  // Attempt reconnection
  if (state.reconnectCount < CONFIG.reconnectAttempts) {
    state.reconnectCount++;
    const delay = CONFIG.reconnectDelay * Math.pow(1.5, state.reconnectCount - 1);
    showToast('warning', 'Reconnecting...', `Attempt ${state.reconnectCount}/${CONFIG.reconnectAttempts} in ${Math.round(delay/1000)}s`);
    setTimeout(connect, delay);
  } else {
    showToast('error', 'Connection Lost', 'Unable to reconnect. Please refresh the page.');
  }
}

function handleConnectionError(error) {
  updateConnectionStatus('disconnected');
  if (state.reconnectCount === 0) {
    showToast('error', 'Connection Failed', 'Could not connect to server. Check your network.');
  }
}

function updateConnectionStatus(status) {
  const indicator = els.statusIndicator;
  const text = els.statusText;

  if (!indicator || !text) return;

  indicator.className = 'status-indicator ' + status;

  switch (status) {
    case 'connected':
      text.textContent = 'Connected';
      break;
    case 'connecting':
      text.textContent = 'Connecting...';
      break;
    case 'disconnected':
      text.textContent = 'Disconnected';
      break;
  }
}

// ========================================
// Room Management
// ========================================

function joinRoom(roomId, username) {
  const finalRoomId = roomId || 'general';
  const finalUsername = username || generateUsername();

  state.roomId = finalRoomId;
  state.username = finalUsername;

  if (state.socket && state.isConnected) {
    state.socket.emit('join-room', {
      roomId: finalRoomId,
      username: finalUsername
    });
  }

  // Update settings
  state.settings.displayName = finalUsername;
  saveSettings();

  // Update UI
  if (els.roomTitle) els.roomTitle.textContent = finalRoomId;
  if (els.roomInput) els.roomInput.value = finalRoomId !== 'general' ? finalRoomId : '';
  if (els.displayNameInput) els.displayNameInput.value = finalUsername;
}

function generateUsername() {
  const adjectives = ['Swift', 'Silent', 'Cosmic', 'Neon', 'Velvet', 'Azure', 'Crimson', 'Golden', 'Lunar', 'Solar'];
  const nouns = ['Phoenix', 'Dragon', 'Wolf', 'Eagle', 'Tiger', 'Shark', 'Falcon', 'Lynx', 'Bear', 'Fox'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 999)}`;
}

function leaveRoom() {
  if (state.socket) {
    state.socket.disconnect();
  }
  state.users.clear();
  state.messages = [];
  state.typingUsers.clear();
  renderMessages();
  renderUsers();
  updateConnectionStatus('disconnected');
  state.isConnected = false;
  state.userId = null;

  // Generate new identity
  const newUsername = generateUsername();
  state.username = newUsername;
  state.settings.displayName = newUsername;
  saveSettings();

  // Reconnect after brief delay
  setTimeout(() => {
    connect();
  }, 500);

  showToast('info', 'Left Room', 'Joining a new room...');
}

// ========================================
// Message Handling
// ========================================

function handleRoomState(data) {
  state.roomId = data.roomId;
  state.username = data.username;
  state.userId = data.userId || state.userId;

  // Update users
  state.users.clear();
  data.users.forEach(user => {
    state.users.set(user.id, user);
  });

  // Update messages
  state.messages = data.messages || [];

  // Update UI
  renderMessages();
  renderUsers();
  updateRoomInfo();

  if (els.roomTitle) els.roomTitle.textContent = data.roomId;
  if (els.roomInput) els.roomInput.value = data.roomId !== 'general' ? data.roomId : '';
  if (els.displayNameInput) els.displayNameInput.value = data.username;
}

function handleNewMessage(message) {
  // Add to state
  state.messages.push(message);
  if (state.messages.length > CONFIG.messageRetention) {
    state.messages = state.messages.slice(-CONFIG.messageRetention);
  }

  // Render
  renderMessage(message);

  // Scroll if at bottom
  if (isNearBottom()) {
    scrollToBottom();
  } else if (message.userId !== state.userId) {
    state.unreadCount++;
    updateUnreadIndicator();
  }

  // Notification for other users' messages
  if (message.userId !== state.userId && !state.isFocused && state.settings.sound) {
    playNotificationSound();
    showBrowserNotification(message);
  }

  // Remove typing indicator for this user
  state.typingUsers.delete(message.userId);
  updateTypingIndicator();
}

function handleUserJoined(data) {
  const user = data.user;
  state.users.set(user.id, user);
  renderUsers();
  updateRoomInfo();

  // Add system message
  addSystemMessage(`${user.username} joined the room`);

  if (user.id !== state.userId) {
    showToast('info', 'User Joined', `${user.username} joined the room`);
  }
}

function handleUserLeft(data) {
  const username = data.username;
  state.users.delete(data.userId);
  state.typingUsers.delete(data.userId);
  renderUsers();
  updateRoomInfo();
  updateTypingIndicator();

  // Add system message
  addSystemMessage(`${username} left the room`);

  if (data.userId !== state.userId) {
    showToast('info', 'User Left', `${username} left the room`);
  }
}

function handleUserTyping(data) {
  if (data.userId === state.userId) return;

  if (data.isTyping) {
    state.typingUsers.set(data.userId, {
      username: data.username,
      timeout: setTimeout(() => {
        state.typingUsers.delete(data.userId);
        updateTypingIndicator();
      }, CONFIG.typingTimeout)
    });
  } else {
    const existing = state.typingUsers.get(data.userId);
    if (existing) {
      clearTimeout(existing.timeout);
      state.typingUsers.delete(data.userId);
    }
  }
  updateTypingIndicator();
}

function addSystemMessage(text) {
  const message = {
    id: 'sys-' + Date.now(),
    userId: 'system',
    username: 'System',
    content: text,
    type: 'system',
    timestamp: Date.now()
  };
  state.messages.push(message);
  renderMessage(message);
  if (isNearBottom()) scrollToBottom();
}

// ========================================
// Sending Messages
// ========================================

function sendMessage(content) {
  if (!state.isConnected || !content.trim()) return false;

  const trimmed = content.trim();
  if (trimmed.length > CONFIG.maxMessageLength) {
    showToast('error', 'Message Too Long', `Maximum ${CONFIG.maxMessageLength} characters allowed`);
    return false;
  }

  state.socket.emit('send-message', {
    content: trimmed,
    type: 'text'
  });

  return true;
}

function handleSendMessage(event) {
  event.preventDefault();

  const input = els.messageInput;
  const content = input.value;

  if (sendMessage(content)) {
    input.value = '';
    input.style.height = 'auto';
    stopTyping();
    updateSendButton();
  }
}

// ========================================
// Typing Indicator
// ========================================

let typingTimeout;

function startTyping() {
  if (!state.isConnected) return;
  state.socket.emit('typing', { isTyping: true });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(stopTyping, CONFIG.typingTimeout);
}

function stopTyping() {
  if (!state.isConnected) return;
  state.socket.emit('typing', { isTyping: false });
  clearTimeout(typingTimeout);
}

// ========================================
// Rendering
// ========================================

function renderMessages() {
  const container = els.messagesList;
  if (!container) return;

  container.innerHTML = '';
  state.messages.forEach(msg => renderMessage(msg, false));
  scrollToBottom(false);
}

function renderMessage(message, animate = true) {
  const container = els.messagesList;
  if (!container) return;

  const isOwn = message.userId === state.userId;
  const isSystem = message.type === 'system' || message.userId === 'system';

  let html;

  if (isSystem) {
    html = `
      <div class="message system" data-id="${escapeHtml(message.id)}">
        <div class="message-content">
          <div class="message-bubble">${escapeHtml(message.content)}</div>
        </div>
      </div>
    `;
  } else {
    const user = state.users.get(message.userId) || { username: message.username };
    const avatarColor = generateAvatarColor(message.username);
    const initials = getInitials(message.username);
    const timeHtml = state.settings.timestamps ? `<span class="message-time">${formatTime(message.timestamp)}</span>` : '';

    html = `
      <div class="message ${isOwn ? 'own' : ''}" data-id="${escapeHtml(message.id)}">
        <div class="message-avatar" style="background: ${avatarColor}">${escapeHtml(initials)}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-username">${escapeHtml(message.username)}${isOwn ? ' (you)' : ''}</span>
            ${timeHtml}
          </div>
          <div class="message-bubble">${escapeHtml(message.content)}</div>
        </div>
      </div>
    `;
  }

  const el = createElement(html);
  container.appendChild(el);

  if (animate) {
    // Force reflow for animation
    el.offsetHeight;
    el.style.animationPlayState = 'running';
  }
}

function renderUsers() {
  const container = els.usersList;
  if (!container) return;

  container.innerHTML = '';

  // Current user first
  const currentUser = state.users.get(state.userId);
  const otherUsers = Array.from(state.users.values()).filter(u => u.id !== state.userId);

  const allUsers = currentUser ? [currentUser, ...otherUsers] : otherUsers;

  allUsers.forEach(user => {
    const isCurrent = user.id === state.userId;
    const avatarColor = generateAvatarColor(user.username);
    const initials = getInitials(user.username);

    const el = createElement(`
      <li class="user-item ${isCurrent ? 'current-user' : ''}" data-user-id="${escapeHtml(user.id)}">
        <div class="user-avatar" style="background: ${avatarColor}">${escapeHtml(initials)}</div>
        <div class="user-info">
          <div class="user-name">${escapeHtml(user.username)}${isCurrent ? ' (you)' : ''}</div>
          <div class="user-status">${isCurrent ? 'Online' : 'Active'}</div>
        </div>
        ${isCurrent ? '<span class="user-badge">You</span>' : ''}
      </li>
    `);
    container.appendChild(el);
  });
}

function updateRoomInfo() {
  if (els.userCount) {
    els.userCount.textContent = state.users.size;
  }
}

function updateTypingIndicator() {
  const container = els.typingIndicator;
  const text = els.typingText;

  if (!container || !text) return;

  const typing = Array.from(state.typingUsers.values());

  if (typing.length === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  if (typing.length === 1) {
    text.textContent = `${typing[0].username} is typing...`;
  } else if (typing.length === 2) {
    text.textContent = `${typing[0].username} and ${typing[1].username} are typing...`;
  } else {
    text.textContent = `${typing.length} people are typing...`;
  }
}

function updateSendButton() {
  const btn = els.sendBtn;
  const input = els.messageInput;
  if (!btn || !input) return;

  const hasContent = input.value.trim().length > 0;
  btn.disabled = !hasContent || !state.isConnected;
}

function updateUnreadIndicator() {
  // Could add a badge to the title or sidebar
  if (state.unreadCount > 0) {
    document.title = `(${state.unreadCount}) aduu`;
  } else {
    document.title = 'aduu';
  }
}

function isNearBottom(threshold = 100) {
  const container = els.messagesContainer;
  if (!container) return true;
  return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
}

function scrollToBottom(smooth = true) {
  const container = els.messagesContainer;
  const marker = els.messagesEndMarker;
  if (!container || !marker) return;

  if (smooth) {
    marker.scrollIntoView({ behavior: 'smooth', block: 'end' });
  } else {
    marker.scrollIntoView({ block: 'end' });
  }
  state.unreadCount = 0;
  updateUnreadIndicator();
}

// ========================================
// UI Interactions
// ========================================

function initEventListeners() {
  // Message form
  els.messageForm.addEventListener('submit', handleSendMessage);

  // Message input
  els.messageInput.addEventListener('input', () => {
    autoResizeTextarea(els.messageInput);
    updateSendButton();
    startTyping();
  });

  els.messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (els.messageInput.value.trim() && state.isConnected) {
        handleSendMessage(e);
      }
    }
  });

  // Theme toggle
  els.themeToggle.addEventListener('click', toggleTheme);

  // Settings
  els.settingsBtn.addEventListener('click', openSettings);
  els.settingsClose.addEventListener('click', closeSettings);
  els.settingsSave.addEventListener('click', saveSettingsHandler);
  els.settingsModal.addEventListener('click', (e) => {
    if (e.target === els.settingsModal || e.target === els.settingsModal.querySelector('.modal-backdrop')) {
      closeSettings();
    }
  });

  // Settings inputs
  els.displayNameInput.addEventListener('input', debounce(() => {
    const name = els.displayNameInput.value.trim().slice(0, 20);
    if (name && name !== state.username) {
      state.username = name;
      if (state.isConnected) {
        // Re-join with new name
        state.socket.emit('join-room', { roomId: state.roomId, username: name });
      }
    }
  }, 300));

  els.roomInput.addEventListener('change', () => {
    const room = els.roomInput.value.trim().slice(0, 30) || 'general';
    if (room !== state.roomId) {
      joinRoom(room, state.username);
    }
  });

  els.soundToggle.addEventListener('change', () => {
    state.settings.sound = els.soundToggle.checked;
    saveSettings();
  });

  els.timestampsToggle.addEventListener('change', () => {
    state.settings.timestamps = els.timestampsToggle.checked;
    saveSettings();
    renderMessages(); // Re-render to show/hide timestamps
  });

  els.leaveRoomBtn.addEventListener('click', () => {
    closeSettings();
    leaveRoom();
  });

  // Copy room link
  els.copyRoomBtn.addEventListener('click', copyRoomLink);

  // Sidebar toggle (mobile)
  els.menuToggle.addEventListener('click', toggleSidebar);

  // Drawer backdrop click (mobile)
  if (els.drawerBackdrop) {
    els.drawerBackdrop.addEventListener('click', closeSidebar);
  }

  // Attach button (placeholder)
  els.attachBtn.addEventListener('click', () => {
    showToast('info', 'Coming Soon', 'File sharing will be available in a future update');
  });

  // Focus/blur for notifications
  window.addEventListener('focus', () => {
    state.isFocused = true;
    state.unreadCount = 0;
    updateUnreadIndicator();
  });

  window.addEventListener('blur', () => {
    state.isFocused = false;
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Escape to close modal or sidebar
    if (e.key === 'Escape') {
      if (els.settingsModal.open) {
        closeSettings();
      } else if (els.sidebar.classList.contains('open')) {
        closeSidebar();
      }
    }
    // Ctrl/Cmd + K for focus input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      els.messageInput.focus();
    }
    // Ctrl/Cmd + / for settings
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      openSettings();
    }
  });

  // Scroll listener for unread tracking
  els.messagesContainer.addEventListener('scroll', throttle(() => {
    if (isNearBottom(50)) {
      state.unreadCount = 0;
      updateUnreadIndicator();
    }
  }, 100));
}

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  const newHeight = Math.min(textarea.scrollHeight, 160);
  textarea.style.height = newHeight + 'px';
}

function openSettings() {
  els.settingsModal.showModal();
  els.displayNameInput.focus();
}

function closeSettings() {
  els.settingsModal.close();
}

function saveSettingsHandler() {
  state.settings.displayName = els.displayNameInput.value.trim().slice(0, 20) || state.username;
  state.settings.sound = els.soundToggle.checked;
  state.settings.timestamps = els.timestampsToggle.checked;
  saveSettings();
  applySettings();
  closeSettings();
  showToast('success', 'Settings Saved', 'Your preferences have been updated');
}

function toggleSidebar() {
  const sidebar = els.sidebar;
  const backdrop = els.drawerBackdrop;
  const isOpen = sidebar.classList.toggle('open');
  if (backdrop) {
    backdrop.classList.toggle('visible', isOpen);
  }
  els.menuToggle.setAttribute('aria-expanded', isOpen);
}

function closeSidebar() {
  const sidebar = els.sidebar;
  const backdrop = els.drawerBackdrop;
  sidebar.classList.remove('open');
  if (backdrop) {
    backdrop.classList.remove('visible');
  }
  els.menuToggle.setAttribute('aria-expanded', 'false');
}

function copyRoomLink() {
  const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(state.roomId)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('success', 'Link Copied', 'Room link copied to clipboard');
  }).catch(() => {
    showToast('error', 'Copy Failed', 'Could not copy link. Please try manually.');
  });
}

// ========================================
// Notifications
// ========================================

function playNotificationSound() {
  // Create a subtle notification sound using Web Audio API
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Ignore audio errors
  }
}

function showBrowserNotification(message) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  new Notification('aduu', {
    body: `${message.username}: ${message.content.slice(0, 100)}`,
    icon: '/favicon.ico',
    tag: 'aduu-message',
    renotify: true
  });
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ========================================
// Initialization
// ========================================

function cacheElements() {
  els.loadingScreen = $('#loadingScreen');
  els.chatInterface = $('#chatInterface');
  els.loadingProgress = $('#loadingProgress');
  els.sidebar = $('#sidebar');
  els.drawerBackdrop = $('#drawerBackdrop');
  els.roomTitle = $('#roomTitle');
  els.roomInput = $('#roomInput');
  els.userCount = $('#userCount');
  els.usersList = $('#usersList');
  els.messagesContainer = $('#messagesContainer');
  els.messagesList = $('#messagesList');
  els.messagesEndMarker = $('#messagesEndMarker');
  els.typingIndicator = $('#typingIndicator');
  els.typingText = $('#typingText');
  els.messageForm = $('#messageForm');
  els.messageInput = $('#messageInput');
  els.sendBtn = $('#sendBtn');
  els.statusIndicator = $('#statusIndicator');
  els.statusText = $('#statusText');
  els.themeToggle = $('#themeToggle');
  els.settingsBtn = $('#settingsBtn');
  els.settingsModal = $('#settingsModal');
  els.settingsClose = $('#settingsClose');
  els.settingsSave = $('#settingsSave');
  els.displayNameInput = $('#displayNameInput');
  els.soundToggle = $('#soundToggle');
  els.timestampsToggle = $('#timestampsToggle');
  els.leaveRoomBtn = $('#leaveRoomBtn');
  els.copyRoomBtn = $('#copyRoomBtn');
  els.menuToggle = $('#menuToggle');
  els.attachBtn = $('#attachBtn');
  els.toastContainer = $('#toastContainer');
}

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  if (room) {
    state.roomId = room.slice(0, 30);
  }
}

function simulateLoading() {
  return new Promise(resolve => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(resolve, 300);
      }
      if (els.loadingProgress) {
        els.loadingProgress.style.width = `${progress}%`;
      }
    }, 100);
  });
}

async function init() {
  cacheElements();
  parseUrlParams();
  initTheme();
  loadSettings();
  applySettings();
  initEventListeners();
  requestNotificationPermission();

  // Simulate loading for smooth UX
  await simulateLoading();

  // Hide loading, show chat
  els.loadingScreen.classList.add('hidden');
  setTimeout(() => {
    els.loadingScreen.hidden = true;
    els.chatInterface.hidden = false;
    els.messageInput.focus();
  }, 300);

  // Connect to server
  connect();

  // Handle before unload
  window.addEventListener('beforeunload', () => {
    if (state.socket) {
      state.socket.disconnect();
    }
  });

  console.log('%c🌊 aduu', 'font-size: 24px; font-weight: 700; color: #06b6d4;');
  console.log('%cEphemeral chat - No logs, no history, no tracking', 'color: #64748b;');
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}