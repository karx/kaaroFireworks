# Setup Instructions for Multi-User Sync

## ✅ Step 1: Apply Firebase Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ig-tool-rm**
3. Navigate to **Build** → **Realtime Database**
4. Click on the **Rules** tab
5. Replace the existing rules with the content from `firebase-rules.json`:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".indexOn": ["createdAt"],
        "events": {
          ".indexOn": ["timestamp"]
        },
        "participants": {
          ".indexOn": ["joinedAt", "lastSeen"]
        }
      }
    }
  }
}
```

6. Click **Publish**

## ✅ Step 2: Test the Feature

### Testing Locally

1. Open the app: [https://8000-0199ffff-919b-798c-a421-6dc4695f5159.ona.app](https://8000-0199ffff-919b-798c-a421-6dc4695f5159.ona.app)
2. Click the **Share (📤)** button
3. Scroll to **Multi-User Sync 🌐** section
4. Enter your name (e.g., "Host")
5. Click **🎪 Create Room**
6. You should see:
   - Room code (6 characters)
   - Participant count: 1
   - Your name in the participant list

### Testing Across Devices

**Device 1 (Host):**
1. Create a room as above
2. Copy the room code (e.g., "ABC123")
3. Click **🔗 Copy Room Link** button

**Device 2 (Guest):**
1. Open the app in a different browser/device
2. Click **Share (📤)** button
3. Enter your name (e.g., "Guest")
4. Enter the room code in the input field
5. Click **🚪 Join**

**OR** use the direct link:
1. Paste the room link in browser
2. Enter your name when prompted
3. Automatically joins the room

### Testing Synchronization

Once both devices are connected:
1. Click anywhere on the canvas on Device 1
2. The firework should appear on BOTH devices simultaneously
3. Try clicking on Device 2 - should sync to Device 1
4. Try text explosions - should sync across devices
5. Check participant list updates in real-time

## ✅ Step 3: Verify Firebase Data

1. Go to Firebase Console → Realtime Database
2. Click on the **Data** tab
3. You should see:
   ```
   rooms/
     └── ABC123/
         ├── metadata/
         ├── participants/
         ├── events/
         └── settings/
   ```
4. Expand to see real-time data updates

## 🎯 Expected Behavior

### Room Creation
- ✅ Room code generated (6 uppercase characters)
- ✅ UI switches to "connected" state
- ✅ Room code displayed
- ✅ Participant count shows 1
- ✅ Your name appears in participant list with 👑 badge

### Room Joining
- ✅ Room code validation
- ✅ UI switches to "connected" state
- ✅ Participant count increases
- ✅ Your name appears in participant list
- ✅ Host sees new participant join

### Synchronization
- ✅ Fireworks appear on all devices simultaneously
- ✅ Latency < 200ms typical
- ✅ Text explosions synchronized
- ✅ Settings synchronized (host controls)

### Presence
- ✅ Participants shown in real-time
- ✅ Last seen updates every 30s
- ✅ Participants removed when they leave

## 🐛 Troubleshooting

### "Firebase not initialized"
**Check:**
- Firebase SDK loaded (check browser console)
- Config is correct in `js/ui.js`
- Database URL is correct

**Fix:**
- Reload the page
- Check browser console for errors
- Verify Firebase project is active

### "Failed to create room"
**Check:**
- Firebase Realtime Database is enabled
- Security rules are published
- Network connection is active

**Fix:**
- Apply security rules from Step 1
- Check Firebase Console for errors
- Try again after a few seconds

### "Room not found"
**Check:**
- Room code is correct (case-sensitive)
- Room was created successfully
- Room hasn't expired

**Fix:**
- Create a new room
- Double-check the room code
- Use the direct link instead

### Fireworks not syncing
**Check:**
- Both devices are in the same room
- Room codes match
- Network connection is stable

**Fix:**
- Leave and rejoin the room
- Check browser console for errors
- Verify Firebase rules allow reads/writes

### High latency (>500ms)
**Check:**
- Network connection speed
- Firebase region (should be close to users)
- Number of participants (>20 may slow down)

**Fix:**
- Use faster network connection
- Reduce number of participants
- Check Firebase Console for performance metrics

## 📊 Monitoring

### Firebase Console
1. Go to **Realtime Database** → **Usage** tab
2. Monitor:
   - Simultaneous connections
   - Storage used
   - Bandwidth used
   - Operations per second

### Browser Console
1. Open Developer Tools (F12)
2. Check Console tab for:
   - "✅ Firebase initialized successfully"
   - "Room created: ABC123"
   - "Joined room: ABC123"
   - Event logs

### Network Tab
1. Open Developer Tools → Network tab
2. Filter by "firebase"
3. Monitor WebSocket connections
4. Check for errors or failed requests

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Room creation shows success message
- ✅ Room code is displayed
- ✅ Participant list updates in real-time
- ✅ Fireworks appear on all devices simultaneously
- ✅ No errors in browser console
- ✅ Firebase Console shows active connections

## 📱 Testing Checklist

- [ ] Create room successfully
- [ ] Room code displayed
- [ ] Join room with code
- [ ] Join room with direct link
- [ ] Participant list updates
- [ ] Fireworks synchronized
- [ ] Text explosions synchronized
- [ ] Leave room works
- [ ] Copy room link works
- [ ] Multiple participants (3+)
- [ ] Cross-device testing
- [ ] Mobile browser testing
- [ ] Network disconnect/reconnect

## 🚀 Next Steps

Once testing is complete:
1. Deploy to production (Netlify)
2. Test with real users
3. Monitor Firebase usage
4. Gather feedback
5. Iterate on features

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase setup is correct
3. Review `FIREBASE_SETUP.md` for detailed guide
4. Check Firebase status page
5. Test with different browsers/devices

---

**Version**: 2.4
**Status**: Ready for Testing
**Last Updated**: 2025-01-20
