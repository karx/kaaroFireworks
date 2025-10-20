// UI module
// Handles all UI controls, panels, and user interactions

let selectedExplosionType = 'random';
let autoLaunchInterval = null;

// Initialize UI
function initUI() {
    initPanelControls();
    initSettingsControls();
    initShareControls();
    initPerformanceControls();
    initAutoLaunch();
}

// Panel controls
function initPanelControls() {
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsClose = document.getElementById('settingsClose');
    const shareToggle = document.getElementById('shareToggle');
    const sharePanel = document.getElementById('sharePanel');
    const shareClose = document.getElementById('shareClose');
    const panelBackdrop = document.getElementById('panelBackdrop');
    
    function closePanels() {
        settingsPanel?.classList.add('hidden');
        sharePanel?.classList.add('hidden');
        panelBackdrop?.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    function openPanel(panel) {
        closePanels();
        panel.classList.remove('hidden');
        panelBackdrop?.classList.remove('hidden');
        
        if (window.innerWidth < 768) {
            document.body.style.overflow = 'hidden';
        }
        
        panel.scrollTop = 0;
    }
    
    settingsToggle?.addEventListener('click', () => {
        if (settingsPanel.classList.contains('hidden')) {
            openPanel(settingsPanel);
        } else {
            closePanels();
        }
    });
    
    settingsClose?.addEventListener('click', (e) => {
        e.stopPropagation();
        closePanels();
    });
    
    shareToggle?.addEventListener('click', () => {
        if (sharePanel.classList.contains('hidden')) {
            openPanel(sharePanel);
        } else {
            closePanels();
        }
    });
    
    shareClose?.addEventListener('click', (e) => {
        e.stopPropagation();
        closePanels();
    });
    
    panelBackdrop?.addEventListener('click', () => {
        closePanels();
    });
}

// Settings controls
function initSettingsControls() {
    // Background selection
    const bgOptions = document.querySelectorAll('.bg-option');
    bgOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            bgOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.config.background = btn.dataset.bg;
            
            if (window.config.background === 'starry') {
                window.initStars();
            } else if (window.config.background === 'city') {
                window.initCity();
            }
        });
    });
    
    // Explosion type selection
    const explosionTypeSelect = document.getElementById('explosionType');
    explosionTypeSelect?.addEventListener('change', (e) => {
        selectedExplosionType = e.target.value;
    });
    
    // Volume control
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    
    volumeSlider?.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        window.audioConfig.volume = volume;
        volumeValue.textContent = e.target.value + '%';
        
        if (window.masterGain) {
            window.masterGain.gain.value = volume;
        }
    });
    
    // Audio preset selection
    const audioPresetSelect = document.getElementById('audioPreset');
    audioPresetSelect?.addEventListener('change', (e) => {
        window.audioConfig.preset = e.target.value;
    });
    
    // Text explosions
    const textInput = document.getElementById('textInput');
    const launchTextBtn = document.getElementById('launchTextBtn');
    const textSize = document.getElementById('textSize');
    const textSizeValue = document.getElementById('textSizeValue');
    
    textSize?.addEventListener('input', (e) => {
        if (textSizeValue) textSizeValue.textContent = e.target.value;
    });
    
    launchTextBtn?.addEventListener('click', () => {
        const text = textInput?.value.trim();
        if (text) {
            const fontSize = parseInt(textSize?.value || 100);
            const centerX = window.canvas.width / 2;
            const centerY = window.canvas.height * 0.3;
            
            // Check if it's multiple words
            if (text.includes(' ')) {
                window.spellWordSequence(text, {
                    fontSize: fontSize,
                    centerY: centerY,
                    spacing: fontSize * 2,
                    delay: 800
                });
            } else {
                window.launchTextFirework(text, centerX, centerY, {
                    fontSize: fontSize
                });
            }
            
            // Clear input
            if (textInput) textInput.value = '';
        }
    });
    
    // Allow Enter key to launch text
    textInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            launchTextBtn?.click();
        }
    });
    
    // Image/Logo explosions
    const imageUpload = document.getElementById('imageUpload');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const useImageColors = document.getElementById('useImageColors');
    const imageSize = document.getElementById('imageSize');
    const imageSizeValue = document.getElementById('imageSizeValue');
    
    let currentImage = null;
    
    imageSize?.addEventListener('input', (e) => {
        if (imageSizeValue) imageSizeValue.textContent = e.target.value;
    });
    
    uploadImageBtn?.addEventListener('click', () => {
        imageUpload?.click();
    });
    
    imageUpload?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            window.loadImageFromFile(file, (img) => {
                currentImage = img;
                if (uploadImageBtn) uploadImageBtn.textContent = '🎆 Launch Image';
                
                // Auto-launch the image
                const maxWidth = parseInt(imageSize?.value || 300);
                const centerX = window.canvas.width / 2;
                const centerY = window.canvas.height * 0.3;
                
                window.launchImageFirework(img, centerX, centerY, {
                    maxWidth: maxWidth,
                    useImageColors: useImageColors?.checked !== false
                });
            });
        }
    });
}

// Share controls
function initShareControls() {
    const captureBtn = document.getElementById('captureBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const qrCodeBtn = document.getElementById('qrCodeBtn');
    const shareBtn = document.getElementById('shareBtn');
    const showButtons = document.querySelectorAll('.show-btn');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const configNameInput = document.getElementById('configName');
    const shareMessage = document.getElementById('shareMessage');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    
    function showShareMessage(message, isSuccess = true) {
        shareMessage.textContent = message;
        shareMessage.className = `share-message ${isSuccess ? 'success' : 'error'}`;
        shareMessage.classList.remove('hidden');
        setTimeout(() => shareMessage.classList.add('hidden'), 3000);
    }
    
    captureBtn?.addEventListener('click', () => {
        if (window.captureScreenshot()) {
            showShareMessage('Screenshot saved!');
        } else {
            showShareMessage('Screenshot failed', false);
        }
    });
    
    copyLinkBtn?.addEventListener('click', async () => {
        const url = window.generateShareURL();
        try {
            await navigator.clipboard.writeText(url);
            showShareMessage('Link copied to clipboard!');
        } catch (e) {
            showShareMessage('Failed to copy link', false);
        }
    });
    
    qrCodeBtn?.addEventListener('click', () => {
        const url = window.generateShareURL();
        if (typeof QRCode !== 'undefined') {
            qrCodeContainer.classList.remove('hidden');
            const qrCanvas = document.getElementById('qrCanvas');
            QRCode.toCanvas(qrCanvas, url, { width: 200 }, (error) => {
                if (error) showShareMessage('QR code generation failed', false);
            });
        } else {
            showShareMessage('QR code library not loaded', false);
        }
    });
    
    shareBtn?.addEventListener('click', () => {
        window.shareScreenshot();
    });
    
    showButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const showName = btn.dataset.show;
            if (window.currentShow === showName) {
                window.stopPresetShow();
                btn.classList.remove('playing');
            } else {
                showButtons.forEach(b => b.classList.remove('playing'));
                window.playPresetShow(showName);
                btn.classList.add('playing');
            }
        });
    });
    
    saveConfigBtn?.addEventListener('click', () => {
        const name = configNameInput.value.trim();
        if (name) {
            window.saveConfiguration(name);
            showShareMessage(`Configuration "${name}" saved!`);
            configNameInput.value = '';
            updateSavedConfigsList();
        }
    });
    
    function updateSavedConfigsList() {
        const savedConfigsList = document.getElementById('savedConfigsList');
        if (!savedConfigsList) return;
        
        const configs = window.getSavedConfigurations();
        savedConfigsList.innerHTML = '';
        
        Object.keys(configs).forEach(name => {
            const item = document.createElement('div');
            item.className = 'saved-config-item';
            item.innerHTML = `
                <span class="saved-config-name">${name}</span>
                <span class="saved-config-delete">✕</span>
            `;
            
            item.querySelector('.saved-config-name').addEventListener('click', () => {
                window.loadConfiguration(name);
                updateUIFromConfig();
                showShareMessage(`Configuration "${name}" loaded!`);
            });
            
            item.querySelector('.saved-config-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                window.deleteConfiguration(name);
                updateSavedConfigsList();
                showShareMessage(`Configuration "${name}" deleted!`);
            });
            
            savedConfigsList.appendChild(item);
        });
    }
    
    updateSavedConfigsList();
}

// Performance controls
function initPerformanceControls() {
    const adaptiveQualityCheckbox = document.getElementById('adaptiveQuality');
    const batterySavingCheckbox = document.getElementById('batterySaving');
    const reducedMotionCheckbox = document.getElementById('reducedMotion');
    const showProfilerCheckbox = document.getElementById('showProfiler');
    const profilerElement = document.getElementById('profiler');
    
    adaptiveQualityCheckbox?.addEventListener('change', (e) => {
        window.performanceConfig.adaptiveQuality = e.target.checked;
    });
    
    batterySavingCheckbox?.addEventListener('change', (e) => {
        window.performanceConfig.batterySaving = e.target.checked;
    });
    
    reducedMotionCheckbox?.addEventListener('change', (e) => {
        window.performanceConfig.reducedMotion = e.target.checked;
    });
    
    showProfilerCheckbox?.addEventListener('change', (e) => {
        window.performanceConfig.showProfiler = e.target.checked;
        profilerElement?.classList.toggle('hidden', !e.target.checked);
    });
}

// Auto launch
function initAutoLaunch() {
    const autoLaunchBtn = document.getElementById('autoLaunch');
    
    autoLaunchBtn?.addEventListener('click', () => {
        if (autoLaunchInterval) {
            clearInterval(autoLaunchInterval);
            autoLaunchInterval = null;
            autoLaunchBtn.classList.remove('active');
            autoLaunchBtn.textContent = 'Auto Launch';
        } else {
            autoLaunchInterval = setInterval(() => {
                const x = Math.random() * window.canvas.width;
                const y = Math.random() * window.canvas.height * 0.5;
                window.launchFirework(x, y);
            }, 800);
            autoLaunchBtn.classList.add('active');
            autoLaunchBtn.textContent = 'Stop Auto Launch';
        }
    });
}

// Update UI from config
function updateUIFromConfig() {
    // Update background buttons
    document.querySelectorAll('.bg-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.bg === window.config.background);
    });
    
    // Update explosion type
    const explosionTypeSelect = document.getElementById('explosionType');
    if (explosionTypeSelect) {
        explosionTypeSelect.value = selectedExplosionType;
    }
    
    // Update volume
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    if (volumeSlider && window.audioConfig) {
        const volume = Math.round(window.audioConfig.volume * 100);
        volumeSlider.value = volume;
        volumeValue.textContent = volume + '%';
    }
    
    // Update audio preset
    const audioPresetSelect = document.getElementById('audioPreset');
    if (audioPresetSelect && window.audioConfig) {
        audioPresetSelect.value = window.audioConfig.preset;
    }
}

// User interaction - click/touch to launch fireworks
function initUserInteraction() {
    window.canvas.addEventListener('click', (e) => {
        window.initAudio();
        window.launchFirework(e.clientX, e.clientY);
        
        // Broadcast to room if connected
        if (window.syncState?.isConnected && window.broadcastFirework) {
            window.broadcastFirework(e.clientX, e.clientY, 'firework', {
                explosionType: window.selectedExplosionType || 'random'
            });
        }
    });
    
    window.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.initAudio();
        const touch = e.touches[0];
        window.launchFirework(touch.clientX, touch.clientY);
        
        // Broadcast to room if connected
        if (window.syncState?.isConnected && window.broadcastFirework) {
            window.broadcastFirework(touch.clientX, touch.clientY, 'firework', {
                explosionType: window.selectedExplosionType || 'random'
            });
        }
    });
}

// Load config from URL on startup
function loadURLConfig() {
    const urlConfig = window.getConfigFromURL();
    if (urlConfig) {
        if (urlConfig.background) window.config.background = urlConfig.background;
        if (urlConfig.explosionType) selectedExplosionType = urlConfig.explosionType;
        if (urlConfig.audioPreset && window.audioConfig) window.audioConfig.preset = urlConfig.audioPreset;
        if (urlConfig.volume !== undefined && window.audioConfig) window.audioConfig.volume = urlConfig.volume;
        updateUIFromConfig();
    }
}

// Multi-user sync controls
function initSyncControls() {
    const createRoomBtn = document.getElementById('createRoomBtn');
    const joinRoomBtn = document.getElementById('joinRoomBtn');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    const copyRoomLinkBtn = document.getElementById('copyRoomLinkBtn');
    const userName = document.getElementById('userName');
    const roomCodeInput = document.getElementById('roomCodeInput');
    const syncConnected = document.getElementById('syncConnected');
    const syncNotConnected = document.getElementById('syncNotConnected');
    
    // Initialize Firebase with project config
    const firebaseConfig = {
        apiKey: "AIzaSyAxxfI0aRS71NOE9VPMYsRKrm72ui4BREg",
        authDomain: "ig-tool-rm.firebaseapp.com",
        databaseURL: "https://ig-tool-rm.firebaseio.com",
        projectId: "ig-tool-rm",
        storageBucket: "ig-tool-rm.firebasestorage.app",
        messagingSenderId: "492451868539",
        appId: "1:492451868539:web:ac41abaa741b623b1e97de",
        measurementId: "G-GLG0G677HG"
    };
    
    // Initialize Firebase
    if (typeof window.initFirebase === 'function') {
        const initialized = window.initFirebase(firebaseConfig);
        if (initialized) {
            console.log('✅ Firebase initialized successfully');
        } else {
            console.error('❌ Firebase initialization failed');
        }
    }
    
    createRoomBtn?.addEventListener('click', async () => {
        const name = userName?.value.trim() || 'Host';
        const result = await window.createRoom(name);
        
        if (result) {
            syncNotConnected?.classList.add('hidden');
            syncConnected?.classList.remove('hidden');
            
            const roomCodeEl = document.getElementById('currentRoomCode');
            if (roomCodeEl) roomCodeEl.textContent = result.roomId;
            
            showShareMessage(`Room created! Code: ${result.roomId}`, true);
        } else {
            showShareMessage('Failed to create room. Check Firebase setup.', false);
        }
    });
    
    joinRoomBtn?.addEventListener('click', async () => {
        const roomCode = roomCodeInput?.value.trim().toUpperCase();
        const name = userName?.value.trim() || 'Guest';
        
        if (!roomCode) {
            showShareMessage('Please enter a room code', false);
            return;
        }
        
        const result = await window.joinRoom(roomCode, name);
        
        if (result) {
            syncNotConnected?.classList.add('hidden');
            syncConnected?.classList.remove('hidden');
            
            const roomCodeEl = document.getElementById('currentRoomCode');
            if (roomCodeEl) roomCodeEl.textContent = result.roomId;
            
            showShareMessage(`Joined room: ${result.roomId}`, true);
        } else {
            showShareMessage('Failed to join room. Check room code.', false);
        }
    });
    
    leaveRoomBtn?.addEventListener('click', async () => {
        await window.leaveRoom();
        
        syncConnected?.classList.add('hidden');
        syncNotConnected?.classList.remove('hidden');
        
        if (roomCodeInput) roomCodeInput.value = '';
        
        showShareMessage('Left room', true);
    });
    
    copyRoomLinkBtn?.addEventListener('click', async () => {
        if (window.syncState?.roomId) {
            const link = window.getRoomShareLink(window.syncState.roomId);
            try {
                await navigator.clipboard.writeText(link);
                showShareMessage('Room link copied!', true);
            } catch (e) {
                showShareMessage('Failed to copy link', false);
            }
        }
    });
    
    // Check URL for room code on load
    if (typeof window.checkURLForRoom === 'function') {
        window.checkURLForRoom();
    }
    
    function showShareMessage(message, isSuccess = true) {
        const shareMessage = document.getElementById('shareMessage');
        if (shareMessage) {
            shareMessage.textContent = message;
            shareMessage.className = `share-message ${isSuccess ? 'success' : 'error'}`;
            shareMessage.classList.remove('hidden');
            setTimeout(() => shareMessage.classList.add('hidden'), 3000);
        }
    }
}

// Export for global access
window.selectedExplosionType = selectedExplosionType;
window.updateUIFromConfig = updateUIFromConfig;
window.initUI = initUI;
window.initUserInteraction = initUserInteraction;
window.loadURLConfig = loadURLConfig;
window.initSyncControls = initSyncControls;
