// Multi-user synchronization module
// Handles real-time room-based firework synchronization using Firebase

// Firebase configuration (will be initialized from environment or config)
let firebaseApp = null;
let database = null;
let currentRoom = null;
let currentUser = null;

// Room state
const syncState = {
    isConnected: false,
    roomId: null,
    userId: null,
    isHost: false,
    participants: {},
    eventListeners: []
};

// Initialize Firebase (user needs to provide their own config)
function initFirebase(config) {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Please include Firebase scripts.');
        return false;
    }
    
    try {
        firebaseApp = firebase.initializeApp(config);
        database = firebase.database();
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// Generate random room ID (6 characters)
function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomId = '';
    for (let i = 0; i < 6; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return roomId;
}

// Generate random user ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Create a new room
async function createRoom(userName = 'Host') {
    if (!database) {
        console.error('Firebase not initialized');
        return null;
    }
    
    const roomId = generateRoomId();
    const userId = generateUserId();
    
    const roomData = {
        metadata: {
            name: `${userName}'s Room`,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            createdBy: userId,
            isActive: true
        },
        participants: {
            [userId]: {
                name: userName,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                isHost: true,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            }
        },
        settings: {
            background: window.config?.background || 'starry',
            audioPreset: window.audioConfig?.preset || 'realistic',
            allowParticipantLaunch: true
        }
    };
    
    try {
        await database.ref(`rooms/${roomId}`).set(roomData);
        
        syncState.roomId = roomId;
        syncState.userId = userId;
        syncState.isHost = true;
        syncState.isConnected = true;
        
        setupRoomListeners(roomId, userId);
        setupPresence(roomId, userId);
        
        console.log('Room created:', roomId);
        return { roomId, userId };
    } catch (error) {
        console.error('Error creating room:', error);
        return null;
    }
}

// Join an existing room
async function joinRoom(roomId, userName = 'Guest') {
    if (!database) {
        console.error('Firebase not initialized');
        return null;
    }
    
    const userId = generateUserId();
    
    try {
        // Check if room exists
        const roomSnapshot = await database.ref(`rooms/${roomId}/metadata`).once('value');
        if (!roomSnapshot.exists()) {
            console.error('Room not found:', roomId);
            return null;
        }
        
        // Add participant
        await database.ref(`rooms/${roomId}/participants/${userId}`).set({
            name: userName,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            isHost: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        
        syncState.roomId = roomId;
        syncState.userId = userId;
        syncState.isHost = false;
        syncState.isConnected = true;
        
        setupRoomListeners(roomId, userId);
        setupPresence(roomId, userId);
        
        console.log('Joined room:', roomId);
        return { roomId, userId };
    } catch (error) {
        console.error('Error joining room:', error);
        return null;
    }
}

// Leave current room
async function leaveRoom() {
    if (!syncState.roomId || !syncState.userId) return;
    
    try {
        // Remove participant
        await database.ref(`rooms/${syncState.roomId}/participants/${syncState.userId}`).remove();
        
        // Clean up listeners
        cleanupListeners();
        
        // Reset state
        syncState.isConnected = false;
        syncState.roomId = null;
        syncState.userId = null;
        syncState.isHost = false;
        syncState.participants = {};
        
        console.log('Left room');
    } catch (error) {
        console.error('Error leaving room:', error);
    }
}

// Set up room event listeners
function setupRoomListeners(roomId, userId) {
    const roomRef = database.ref(`rooms/${roomId}`);
    
    // Listen for new firework events
    const eventsRef = roomRef.child('events');
    const eventListener = eventsRef.on('child_added', (snapshot) => {
        const event = snapshot.val();
        
        // Don't process our own events (already launched locally)
        if (event.userId === userId) return;
        
        // Check event age to avoid processing old events
        const eventAge = Date.now() - event.timestamp;
        if (eventAge > 2000) return; // Skip events older than 2 seconds
        
        // Launch firework based on event type
        handleRemoteEvent(event);
    });
    
    syncState.eventListeners.push({ ref: eventsRef, listener: eventListener });
    
    // Listen for participant changes
    const participantsRef = roomRef.child('participants');
    const participantListener = participantsRef.on('value', (snapshot) => {
        syncState.participants = snapshot.val() || {};
        updateParticipantUI();
    });
    
    syncState.eventListeners.push({ ref: participantsRef, listener: participantListener });
    
    // Listen for settings changes
    const settingsRef = roomRef.child('settings');
    const settingsListener = settingsRef.on('value', (snapshot) => {
        const settings = snapshot.val();
        if (settings && !syncState.isHost) {
            // Apply host's settings
            if (window.config) window.config.background = settings.background;
            if (window.audioConfig) window.audioConfig.preset = settings.audioPreset;
        }
    });
    
    syncState.eventListeners.push({ ref: settingsRef, listener: settingsListener });
}

// Set up presence detection
function setupPresence(roomId, userId) {
    const presenceRef = database.ref(`rooms/${roomId}/participants/${userId}/lastSeen`);
    
    // Update presence on disconnect
    presenceRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
    
    // Update presence periodically
    const presenceInterval = setInterval(() => {
        if (syncState.isConnected) {
            presenceRef.set(firebase.database.ServerValue.TIMESTAMP);
        } else {
            clearInterval(presenceInterval);
        }
    }, 30000); // Every 30 seconds
}

// Clean up all listeners
function cleanupListeners() {
    syncState.eventListeners.forEach(({ ref, listener }) => {
        ref.off('child_added', listener);
        ref.off('value', listener);
    });
    syncState.eventListeners = [];
}

// Broadcast firework event to room
function broadcastFirework(x, y, type = 'firework', config = {}) {
    if (!syncState.isConnected || !syncState.roomId) return;
    
    const event = {
        type: type,
        timestamp: Date.now(),
        x: x / window.canvas.width,  // Normalize to 0-1
        y: y / window.canvas.height,
        config: config,
        userId: syncState.userId
    };
    
    database.ref(`rooms/${syncState.roomId}/events`).push(event);
}

// Handle remote firework event
function handleRemoteEvent(event) {
    // Convert normalized position to screen coordinates
    const x = event.x * window.canvas.width;
    const y = event.y * window.canvas.height;
    
    switch (event.type) {
        case 'firework':
            if (window.launchFirework) {
                const originalType = window.selectedExplosionType;
                window.selectedExplosionType = event.config.explosionType || 'random';
                window.launchFirework(x, y);
                window.selectedExplosionType = originalType;
            }
            break;
            
        case 'text':
            if (window.launchTextFirework) {
                window.launchTextFirework(event.config.text, x, y, event.config);
            }
            break;
            
        case 'image':
            // Image events would need special handling
            console.log('Image event received (not yet implemented)');
            break;
    }
}

// Update participant list UI
function updateParticipantUI() {
    const participantList = document.getElementById('participantList');
    if (!participantList) return;
    
    const participants = Object.entries(syncState.participants);
    
    participantList.innerHTML = participants.map(([id, data]) => {
        const isYou = id === syncState.userId;
        const hostBadge = data.isHost ? '👑 ' : '';
        const youBadge = isYou ? ' (You)' : '';
        return `<div class="participant-item">${hostBadge}${data.name}${youBadge}</div>`;
    }).join('');
    
    // Update participant count
    const countEl = document.getElementById('participantCount');
    if (countEl) countEl.textContent = participants.length;
}

// Get room share link
function getRoomShareLink(roomId) {
    const baseURL = window.location.origin + window.location.pathname;
    return `${baseURL}?room=${roomId}`;
}

// Check for room in URL and auto-join
function checkURLForRoom() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    
    if (roomId) {
        // Show join dialog
        const userName = prompt('Enter your name to join the room:') || 'Guest';
        joinRoom(roomId, userName);
    }
}

// Export to global scope
window.syncState = syncState;
window.initFirebase = initFirebase;
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.leaveRoom = leaveRoom;
window.broadcastFirework = broadcastFirework;
window.getRoomShareLink = getRoomShareLink;
window.checkURLForRoom = checkURLForRoom;
