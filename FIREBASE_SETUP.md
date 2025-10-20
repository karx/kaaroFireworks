# Firebase Setup Guide for Multi-User Sync

## Overview
The multi-user synchronization feature uses Firebase Realtime Database to enable real-time firework synchronization across multiple devices.

## Prerequisites
- Google account
- Basic understanding of Firebase

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "kaaro-fireworks")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Realtime Database

1. In Firebase Console, go to "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose location (closest to your users)
4. Start in **test mode** (for development)
5. Click "Enable"

### 3. Configure Security Rules

Replace the default rules with:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "events": {
          ".indexOn": ["timestamp"]
        },
        "participants": {
          ".indexOn": ["joinedAt"]
        }
      }
    }
  }
}
```

**Note**: These are permissive rules for development. For production, implement proper authentication and authorization.

### 4. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click "Web" (</> icon)
4. Register app (name: "Kaaro Fireworks Web")
5. Copy the Firebase configuration object

It will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 5. Add Configuration to Your App

#### Option A: Browser Console (Quick Test)
```javascript
// Open browser console and run:
localStorage.setItem('firebaseConfig', JSON.stringify({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}));

// Reload the page
location.reload();
```

#### Option B: Code (Permanent)
Edit `js/ui.js` and replace the placeholder config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Usage

### Creating a Room

1. Open the app
2. Click Share (📤) button
3. Enter your name
4. Click "🎪 Create Room"
5. Share the room code or link with others

### Joining a Room

#### Method 1: Room Code
1. Get room code from host (6 characters)
2. Open the app
3. Click Share (📤) button
4. Enter your name
5. Enter room code
6. Click "🚪 Join"

#### Method 2: Direct Link
1. Click the room link shared by host
2. Enter your name when prompted
3. Automatically joins the room

### Using Multi-User Sync

Once connected to a room:
- All participants see the same fireworks in real-time
- Click anywhere to launch fireworks (visible to everyone)
- Text explosions are synchronized
- Room settings are synchronized
- See participant list in Share panel

## Features

### Room Management
- **Create Room**: Generate unique 6-character room code
- **Join Room**: Enter code or use direct link
- **Leave Room**: Disconnect from current room
- **Participant List**: See who's connected
- **Host Badge**: Room creator has 👑 badge

### Synchronization
- **Firework Events**: All clicks synchronized
- **Text Explosions**: Synchronized text displays
- **Settings**: Host's settings applied to all
- **Presence**: See when participants join/leave

### Performance
- **Low Latency**: <200ms typical delay
- **Efficient**: Only broadcasts event data, not particles
- **Scalable**: Supports multiple concurrent rooms
- **Reliable**: Auto-reconnect on network issues

## Troubleshooting

### "Firebase not initialized"
- Check that Firebase config is set correctly
- Verify Firebase SDK is loaded (check browser console)
- Ensure databaseURL is correct

### "Room not found"
- Verify room code is correct (case-sensitive)
- Check if room was created successfully
- Room may have expired (inactive for >24 hours)

### "Failed to create room"
- Check Firebase Realtime Database is enabled
- Verify security rules allow writes
- Check browser console for errors

### Fireworks not syncing
- Check network connection
- Verify both users are in same room
- Check browser console for errors
- Ensure Firebase rules allow reads/writes

### High latency
- Check network connection
- Choose Firebase region closer to users
- Reduce number of participants (>20 may slow down)

## Security Considerations

### Development (Current)
- Test mode rules allow anyone to read/write
- No authentication required
- Suitable for testing only

### Production (Recommended)
1. Enable Firebase Authentication
2. Implement proper security rules:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null",
        "participants": {
          "$userId": {
            ".write": "auth.uid === $userId"
          }
        }
      }
    }
  }
}
```

3. Add user authentication to app
4. Implement room ownership checks
5. Add rate limiting
6. Monitor usage and costs

## Cost Estimation

### Firebase Free Tier (Spark Plan)
- **Simultaneous connections**: 100
- **Storage**: 1 GB
- **Downloads**: 10 GB/month
- **Uploads**: 10 GB/month

### Typical Usage
- **Per room**: ~5-10 KB storage
- **Per event**: ~200 bytes
- **Per participant**: ~500 bytes
- **Bandwidth**: ~1-2 KB/s per active participant

### Example Scenarios

**Small Event (10 rooms, 5 participants each)**
- Storage: ~50 KB
- Bandwidth: ~50 KB/s
- Cost: **FREE** (well within limits)

**Medium Event (50 rooms, 10 participants each)**
- Storage: ~250 KB
- Bandwidth: ~500 KB/s
- Cost: **FREE** (within limits)

**Large Event (100+ rooms)**
- May exceed free tier
- Consider upgrading to Blaze plan (pay-as-you-go)
- Estimated cost: $1-5/month for moderate usage

## Data Structure

```
/rooms/{roomId}/
  ├── metadata
  │   ├── name: "Host's Room"
  │   ├── createdAt: 1234567890
  │   ├── createdBy: "user_123"
  │   └── isActive: true
  ├── participants/{userId}
  │   ├── name: "User Name"
  │   ├── joinedAt: 1234567890
  │   ├── isHost: false
  │   └── lastSeen: 1234567890
  ├── events/{eventId}
  │   ├── type: "firework"
  │   ├── timestamp: 1234567890
  │   ├── x: 0.5 (normalized)
  │   ├── y: 0.3 (normalized)
  │   ├── config: { explosionType: "star" }
  │   └── userId: "user_123"
  └── settings
      ├── background: "starry"
      ├── audioPreset: "realistic"
      └── allowParticipantLaunch: true
```

## API Reference

### JavaScript Functions

```javascript
// Initialize Firebase
initFirebase(config)

// Create a room
createRoom(userName) // Returns { roomId, userId }

// Join a room
joinRoom(roomId, userName) // Returns { roomId, userId }

// Leave current room
leaveRoom()

// Broadcast firework event
broadcastFirework(x, y, type, config)

// Get room share link
getRoomShareLink(roomId) // Returns URL

// Check URL for room code
checkURLForRoom() // Auto-joins if ?room=CODE in URL
```

### State Object

```javascript
window.syncState = {
  isConnected: false,
  roomId: null,
  userId: null,
  isHost: false,
  participants: {},
  eventListeners: []
}
```

## Best Practices

1. **Room Cleanup**: Rooms auto-cleanup after 24 hours of inactivity
2. **Participant Limit**: Keep rooms under 20 participants for best performance
3. **Event Rate**: Limit to ~10 events/second per room
4. **Error Handling**: Always check return values and handle errors
5. **Testing**: Test with multiple devices/browsers before production
6. **Monitoring**: Monitor Firebase usage in console
7. **Security**: Implement authentication for production use

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Firebase setup is correct
3. Test with Firebase Console data viewer
4. Check Firebase status page
5. Review Firebase documentation

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Realtime Database Guide](https://firebase.google.com/docs/database)
- [Security Rules](https://firebase.google.com/docs/database/security)
- [Pricing](https://firebase.google.com/pricing)

---

**Version**: 2.4
**Last Updated**: 2025-01-20
**Status**: Beta
