// Signova App Logic
console.log("Signova System Active");

// DOM Elements
const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement ? canvasElement.getContext('2d') : null;
const statusDot = document.getElementById('system-dot');
const trackerStatus = document.getElementById('tracker-status');

const leftHandOutput = document.getElementById('left-hand-output');
const rightHandOutput = document.getElementById('right-hand-output');

const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const speakBtn = document.getElementById('speak-btn');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');

const toggleSignVoice = document.getElementById('toggle-sign-voice');
const toggleVoiceText = document.getElementById('toggle-voice-text');

// Remote Elements
const remoteVideoElement = document.getElementById('remote-video');
const remoteLeftOutput = document.getElementById('remote-left-output');
const remoteRightOutput = document.getElementById('remote-right-output');
const myPeerIdDisplay = document.getElementById('my-peer-id');
const remotePeerIdInput = document.getElementById('remote-peer-id');
const callBtn = document.getElementById('call-btn');
const copyIdBtn = document.getElementById('copy-id-btn');
const connectionOverlay = document.getElementById('connection-overlay');
const connectionStatus = document.getElementById('connection-status');

// WebRTC & Connection State
let peer;
let currentCall;
let dataConn;
let localStream;
let isBusy = false;

// STT State
let speechRecognition = null;
let isListening = false;
let interimMsg = null;

// Optimization Constants for Accuracy & Reliability
const SMOOTHING_FACTOR = 0.65; // Lower = smoother, higher = more reactive
const LUMINOSITY_THRESHOLD = 50; // Threshold for 'low light' warning
const LANDMARK_BUFFER_SIZE = 15;
const landBuffer = { Left: [], Right: [] };

let modelComplexity = 1; // Default: High Quality

// ICE Servers for WebRTC
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.peerjs.com' }
];

// Chat Expansion Hook
const workspaceContainer = document.querySelector('.workspace-container');
const expandChatBtn = document.getElementById('expand-chat-btn');
let isChatExpanded = false;

if (expandChatBtn && workspaceContainer) {
    expandChatBtn.addEventListener('click', () => {
        isChatExpanded = !isChatExpanded;
        if (isChatExpanded) {
            workspaceContainer.classList.add('chat-expanded');
            expandChatBtn.innerHTML = '<i data-lucide="minimize-2"></i>';
        } else {
            workspaceContainer.classList.remove('chat-expanded');
            expandChatBtn.innerHTML = '<i data-lucide="maximize-2"></i>';
        }
        lucide.createIcons();
    });
}

// Modal Logic
const infoBtn = document.getElementById('info-btn');
const closeModalBtn = document.getElementById('close-modal');
const infoModal = document.getElementById('info-modal');

if (infoBtn && closeModalBtn && infoModal) {
    infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
}

// Profile Logic
const accountBtn = document.getElementById('account-btn');
const profileModal = document.getElementById('profile-modal');
const closeProfileBtn = document.getElementById('close-profile-btn');
const saveProfileBtn = document.getElementById('save-profile-btn');
const profileNameInput = document.getElementById('profile-name-input');
const profilePicInput = document.getElementById('profile-pic-input');
const profilePreviewImg = document.getElementById('profile-preview-img');
const avatarPreviewContainer = document.getElementById('avatar-preview-container');
const profileDisplay = document.getElementById('profile-display');
const profileAvatarImg = document.getElementById('profile-avatar-img');
const profileNameDisplay = document.getElementById('profile-name-display');

let userProfile = { name: '', image: '' };

function updateProfileUI() {
    if ((userProfile.name && userProfile.name.trim() !== '') || userProfile.image) {
        if (profileDisplay) profileDisplay.classList.remove('hidden');
        if (profileNameDisplay) profileNameDisplay.innerText = userProfile.name || '';
        if (profileAvatarImg) {
            profileAvatarImg.src = userProfile.image || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2322c55e" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        }
    } else {
        if (profileDisplay) profileDisplay.classList.add('hidden');
    }
}

function loadProfile() {
    const savedName = localStorage.getItem('signova_userName');
    const savedImg = localStorage.getItem('signova_profileImage');
    if (savedName) userProfile.name = savedName;
    if (savedImg) userProfile.image = savedImg;
    updateProfileUI();
}

// Execute load profile
loadProfile();

if (accountBtn && profileModal) {
    accountBtn.addEventListener('click', () => {
        profileNameInput.value = userProfile.name;
        if (userProfile.image) {
            profilePreviewImg.src = userProfile.image;
            avatarPreviewContainer.classList.remove('hidden');
        } else {
            avatarPreviewContainer.classList.add('hidden');
        }
        profileModal.classList.remove('hidden');
    });
    
    closeProfileBtn.addEventListener('click', () => profileModal.classList.add('hidden'));
    
    if (profilePicInput) {
        profilePicInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    profilePreviewImg.src = readerEvent.target.result;
                    avatarPreviewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    saveProfileBtn.addEventListener('click', () => {
        const newName = profileNameInput.value.trim();
        const newImgSrc = avatarPreviewContainer.classList.contains('hidden') ? '' : profilePreviewImg.src;
        
        userProfile.name = newName;
        userProfile.image = newImgSrc;
        
        localStorage.setItem('signova_userName', newName);
        localStorage.setItem('signova_profileImage', newImgSrc);
        
        updateProfileUI();
        profileModal.classList.add('hidden');
    });
}

// Language Logic
const langBtn = document.getElementById('lang-btn');
const langModal = document.getElementById('language-modal');
const closeLangBtn = document.getElementById('close-lang-btn');
const langOptions = document.querySelectorAll('.lang-option');

const translationDict = {
    "HELLO": { hi: "नमस्ते" },
    "YES": { hi: "हाँ" },
    "NO": { hi: "नहीं" },
    "ONE": { hi: "एक" },
    "TWO": { hi: "दो" },
    "THREE": { hi: "तीन" },
    "FOUR": { hi: "चार" },
    "FIVE": { hi: "पाँच" },
    "THANK": { hi: "धन्यवाद" },
    "I": { hi: "मैं" },
    "LOVE": { hi: "प्यार" },
    "YOU": { hi: "तुम" },
    "MY": { hi: "मेरा" },
    "NAME": { hi: "नाम" },
    "HAPPY": { hi: "खुश" },
    "GOOD": { hi: "अच्छा" },
    "THUMBS DOWN": { hi: "अस्वीकार" },
    "ROCK": { hi: "कमाल" },
    // Phrases
    "I love you": { hi: "मैं तुमसे प्यार करता हूँ" },
    "My name is...": { hi: "मेरा नाम ... है" },
    "I am happy!": { hi: "मैं खुश हूँ!" },
    "Goodbye!": { hi: "अलविदा!" },
    "Thank you!": { hi: "धन्यवाद!" }
};

// ──────────────────────────────────────────────────────────────────
// Syllable-aware English → Hindi transliterator
// Handles: digraphs (sh, ch, kh, gh…), vowel signs (matra),
// halant for consonant clusters, inherent-'a' suppression.
// ──────────────────────────────────────────────────────────────────
function transliterateToHindi(text) {
    if (!text) return '';
    const input = text.trim().toLowerCase();

    // Independent vowels (word-initial / after another vowel)
    const VOWEL_INDEP = { 'a':'अ','aa':'आ','i':'इ','ii':'ई','u':'उ','uu':'ऊ',
                          'e':'ए','ai':'ऐ','o':'ओ','au':'औ','ri':'ऋ' };
    // Vowel diacritics (matra) that follow a consonant
    const VOWEL_MATRA = { 'a':'','aa':'ा','i':'ि','ii':'ी','u':'ु','uu':'ू',
                          'e':'े','ai':'ै','o':'ो','au':'ौ','ri':'ृ' };
    // Consonants (longest match first)
    const CONSONANTS = [
        ['sh','श'],['shh','ष'],['ch','च'],['chh','छ'],
        ['kh','ख'],['gh','घ'],['jh','झ'],['th','थ'],['dh','ध'],
        ['ph','फ'],['bh','भ'],['mh','म'],['nh','न'],['rh','र'],
        ['tr','त्र'],['gn','ज्ञ'],
        ['k','क'],['c','क'],['g','ग'],['j','ज'],['t','त'],['d','द'],
        ['n','न'],['p','प'],['b','ब'],['m','म'],['y','य'],['r','र'],
        ['l','ल'],['v','व'],['w','व'],['s','स'],['h','ह'],['f','फ'],
        ['z','ज़'],['q','क'],['x','क्स']
    ];
    const VOWEL_KEYS_SORTED = ['aa','ii','uu','ai','au','ri','a','i','u','e','o'];
    const isVowel = (s) => VOWEL_KEYS_SORTED.some(v => s.startsWith(v));
    const matchVowel = (s) => VOWEL_KEYS_SORTED.find(v => s.startsWith(v));
    const matchConsonant = (s) => CONSONANTS.find(([c]) => s.startsWith(c));

    let i = 0;
    let result = '';
    let prevWasConsonant = false;  // did we just output a consonant?
    let pendingConsonant = '';      // the Devanagari consonant waiting for its vowel

    const flushConsonant = (matraKey) => {
        if (!pendingConsonant) return;
        result += pendingConsonant + (VOWEL_MATRA[matraKey] ?? 'अ');
        pendingConsonant = '';
    };

    while (i < input.length) {
        const rest = input.slice(i);

        // ── spaces / hyphens ─────────────────────────────────────────
        if (rest[0] === ' ' || rest[0] === '-') {
            if (pendingConsonant) { result += pendingConsonant + 'अ'; pendingConsonant = ''; }
            result += rest[0]; i++; prevWasConsonant = false; continue;
        }

        // ── vowel ─────────────────────────────────────────────────────
        const vKey = matchVowel(rest);
        if (vKey) {
            if (pendingConsonant) {
                flushConsonant(vKey);
            } else {
                // word-initial or post-vowel → independent form
                result += VOWEL_INDEP[vKey];
            }
            i += vKey.length;
            prevWasConsonant = false;
            continue;
        }

        // ── consonant ─────────────────────────────────────────────────
        const cMatch = matchConsonant(rest);
        if (cMatch) {
            const [cRoman, cDeva] = cMatch;
            if (pendingConsonant) {
                // consonant cluster: flush previous with halant
                result += pendingConsonant + '्';
            }
            pendingConsonant = cDeva;
            i += cRoman.length;
            prevWasConsonant = true;
            continue;
        }

        // ── unrecognised character ────────────────────────────────────
        if (pendingConsonant) { result += pendingConsonant + 'अ'; pendingConsonant = ''; }
        result += rest[0]; i++;
    }

    // Flush any trailing consonant with inherent 'a'
    if (pendingConsonant) result += pendingConsonant + 'अ';

    console.log('[Signova] Hindi name transliteration:', text, '→', result);
    return result;
}

let currentLang = localStorage.getItem('signova_lang') || 'en';

function getTranslation(text, lang) {
    if (lang === 'en' || !lang) return text;
    if (text.startsWith("My name is ")) {
        const namePart = text.replace("My name is ", "");
        const translatedName = lang === "hi" ? transliterateToHindi(namePart) : namePart;
        return (translationDict["My name is..."]?.[lang] || "My name is ...").replace("...", translatedName);
    }
    return translationDict[text]?.[lang] || text;
}

if (langBtn && langModal && closeLangBtn) {
    langBtn.addEventListener('click', () => {
        langOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === currentLang);
        });
        langModal.classList.remove('hidden');
    });
    
    closeLangBtn.addEventListener('click', () => langModal.classList.add('hidden'));

    langOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            currentLang = e.currentTarget.dataset.lang;
            localStorage.setItem('signova_lang', currentLang);
            
            langOptions.forEach(o => o.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Retro-update live output
            if (stableGestures.Left && stableGestures.Left !== "" && stableGestures.Left !== "UNKNOWN") {
                setHandOutput("Left", getTranslation(stableGestures.Left, currentLang), false);
            }
            if (stableGestures.Right && stableGestures.Right !== "" && stableGestures.Right !== "UNKNOWN") {
                setHandOutput("Right", getTranslation(stableGestures.Right, currentLang), false);
            }
            
            setTimeout(() => langModal.classList.add('hidden'), 200);
        });
    });
}

// Phrase Sequence Tracking
const PHRASE_WINDOW_MS = 4000;
const gestureSequence = { Left: [], Right: [] };
let activePhraseTimer = { Left: null, Right: null };

const PHRASE_MAP = {
    "I,LOVE,YOU": "I love you",
    "MY,NAME": "My name is...",
    "I,HAPPY": "I am happy!",
    "GOOD,BYE": "Goodbye!",
    "THANK,YOU": "Thank you!"
};

// Prediction Buffer State
const BUFFER_SIZE = 10;
const buffers = { Left: [], Right: [] };
const stableGestures = { Left: "", Right: "" };

const wristHistory = { Left: [], Right: [] };

function isHandWaving(handLabel, wristX) {
    const hist = wristHistory[handLabel];
    hist.push(wristX);
    if (hist.length > 15) hist.shift();
    
    if (hist.length < 10) return false;
    const minX = Math.min(...hist);
    const maxX = Math.max(...hist);
    // Return true if hand moved left-to-right by at least 4% of the screen
    return (maxX - minX) > 0.04;
}

function setHandOutput(handStr, text, isPhrase = false) {
    const el = handStr === 'Left' ? leftHandOutput : rightHandOutput;
    if (el) {
        el.innerText = text;
        if (isPhrase) {
            el.classList.add('phrase-mode');
        } else {
            el.classList.remove('phrase-mode');
        }
    }
}

function updatePrediction(handStr, newGesture) {
    const buffer = buffers[handStr];
    
    if (newGesture === null) {
        buffer.length = 0;
        if (stableGestures[handStr] !== "") {
            stableGestures[handStr] = "";
            setHandOutput(handStr, "--");
        }
        return;
    }

    buffer.push(newGesture);
    if (buffer.length > BUFFER_SIZE) buffer.shift();

    const counts = {};
    let maxCount = 0;
    let dominant = newGesture;
    
    for (const g of buffer) {
        if (g === "UNKNOWN") continue;
        counts[g] = (counts[g] || 0) + 1;
        if (counts[g] > maxCount) {
            maxCount = counts[g];
            dominant = g;
        }
    }

    const activeLength = buffer.filter(g => g !== "UNKNOWN").length;
    const conf = activeLength > 0 ? (maxCount / activeLength) * 100 : 0;

    let requiredConf = 50;
    // Apply higher confidence threshold for specific demo gestures to ensure stability
    if (["THREE", "FOUR", "THUMBS DOWN", "ROCK", "LOVE"].includes(dominant)) {
        requiredConf = 75; // strict 75% stability required
    }

    if (activeLength >= BUFFER_SIZE / 2 && conf > requiredConf && dominant !== stableGestures[handStr]) {
        stableGestures[handStr] = dominant;
        
        // --- Sequence Tracker ---
        const now = Date.now();
        const seq = gestureSequence[handStr];
        
        // Remove sequences older than window
        while (seq.length > 0 && now - seq[0].time > PHRASE_WINDOW_MS) {
            seq.shift();
        }
        
        // Prevent duplicate consecutive entries to sequence 
        if (seq.length === 0 || seq[seq.length - 1].gesture !== dominant) {
            seq.push({ gesture: dominant, time: now });
        }
        
        // Search for phrase match incrementally backwards
        let foundPhrase = null;
        for (let idx = 0; idx < seq.length; idx++) {
            const suffixStr = seq.slice(idx).map(item => item.gesture).join(',');
            if (PHRASE_MAP[suffixStr]) {
                foundPhrase = PHRASE_MAP[suffixStr];
                break;
            }
        }
        
        if (foundPhrase) {
            let outputPhrase = foundPhrase;
            if (foundPhrase === "My name is...") {
                outputPhrase = userProfile.name ? `My name is ${userProfile.name}` : "My name is ...";
            }
            
            const translatedPhrase = getTranslation(outputPhrase, currentLang);
            setHandOutput(handStr, translatedPhrase, true);
            seq.length = 0; // flush sequence on phrase trigger
            
            if (toggleSignVoice && toggleSignVoice.checked) {
                speakText(translatedPhrase);
                addChatMessage('me', `[Signed Phrase]: ${translatedPhrase}`);
            }
            
            // Sync with Peer
            if (dataConn && dataConn.open) {
                dataConn.send({ type: 'gesture', hand: handStr, text: translatedPhrase, isPhrase: true });
            }
            
            // clear phrase highlight after a delay
            clearTimeout(activePhraseTimer[handStr]);
            activePhraseTimer[handStr] = setTimeout(() => {
                if (stableGestures[handStr] !== "") {
                    setHandOutput(handStr, getTranslation(stableGestures[handStr], currentLang), false);
                } else {
                    setHandOutput(handStr, "--", false);
                }
            }, 3000);
            
        } else {
            const translatedDominant = getTranslation(dominant, currentLang);
            setHandOutput(handStr, translatedDominant, false);
            clearTimeout(activePhraseTimer[handStr]);
            
            if (toggleSignVoice && toggleSignVoice.checked && dominant !== "UNKNOWN") {
                speakText(translatedDominant);
                addChatMessage('me', `[Signed]: ${translatedDominant}`);
            }

            // Sync with Peer
            if (dataConn && dataConn.open) {
                dataConn.send({ type: 'gesture', hand: handStr, text: translatedDominant, isPhrase: false });
            }
        }
    }
}

// MediaPipe Setup
let hands;
let camera;

async function setupMediaPipe(stream) {
    if (!videoElement || !canvasElement) return;

    try {
        hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        hands.onResults(onResults);

        // Assign existing stream from health check to video element
        videoElement.srcObject = stream;
        localStream = stream;
        
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            requestAnimationFrame(processFrame);
        };

        async function processFrame() {
            if (videoElement.paused || videoElement.ended) return;
            await hands.send({ image: videoElement });
            requestAnimationFrame(processFrame);
        }

        trackerStatus.innerText = "System Online";
        statusDot.style.animation = "none";
        statusDot.style.opacity = "1";
    } catch (e) {
        console.error(e);
        trackerStatus.innerText = "Processing Error";
        statusDot.classList.add('error');
    }
}

function resizeCanvas() {
    if (videoElement && canvasElement) {
        if (canvasElement.width !== videoElement.videoWidth && videoElement.videoWidth > 0) {
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;
        }
    }
}

// 2. Brightness Check
let lastBrightnessCheck = 0;
function checkLighting(img) {
    const now = Date.now();
    if (now - lastBrightnessCheck < 5000) return; // Check every 5s
    lastBrightnessCheck = now;
    
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = 40; tempCanvas.height = 30; // low res for speed
    ctx.drawImage(img, 0, 0, 40, 30);
    const data = ctx.getImageData(0, 0, 40, 30).data;
    
    let totalLuminance = 0;
    for (let i = 0; i < data.length; i += 4) {
        // Simple human perception weighting
        totalLuminance += (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
    }
    const avg = totalLuminance / (40 * 30);
    
    // UI Warning
    let warning = document.getElementById('lighting-warning');
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'lighting-warning';
        warning.className = 'lighting-warning';
        warning.innerHTML = '<i data-lucide="sun"></i><span>LIGHTING TOO LOW</span>';
        document.getElementById('local-video-wrap').appendChild(warning);
        // Finalize Icons
        lucide.createIcons();

        // ---------- Particle Background Engine ----------
        (function initParticles() {
            const canvas = document.getElementById('particles-bg');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            let particlesArray = [];

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            class Particle {
                constructor(x, y, dx, dy, size, color) {
                    this.x = x;
                    this.y = y;
                    this.dx = dx;
                    this.dy = dy;
                    this.size = size;
                    this.color = color;
                }
                draw() {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                }
                update() {
                    if (this.x > canvas.width || this.x < 0) this.dx = -this.dx;
                    if (this.y > canvas.height || this.y < 0) this.dy = -this.dy;
                    this.x += this.dx;
                    this.y += this.dy;
                    this.draw();
                }
            }

            function init() {
                particlesArray = [];
                let numberOfParticles = (canvas.height * canvas.width) / 18000;
                for (let i = 0; i < numberOfParticles; i++) {
                    let size = Math.random() * 2 + 1;
                    let x = Math.random() * (canvas.width - size * 2) + size;
                    let y = Math.random() * (canvas.height - size * 2) + size;
                    let dx = Math.random() * 0.8 - 0.4;
                    let dy = Math.random() * 0.8 - 0.4;
                    let color = 'rgba(34, 197, 94, 0.3)';
                    particlesArray.push(new Particle(x, y, dx, dy, size, color));
                }
            }

            function animate() {
                requestAnimationFrame(animate);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particlesArray.forEach(p => p.update());
            }

            init();
            animate();

            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                init();
            });
        })();
    }
    
    if (avg < LUMINOSITY_THRESHOLD) {
        warning.classList.add('active');
    } else {
        warning.classList.remove('active');
    }
}

const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

const isFingerExtended = (landmarks, tipIdx, pipIdx, anchorIdx) => {
    // Relative distance check: Is tip further from wrist than PIP?
    const tipDist = dist(landmarks[tipIdx], landmarks[0]);
    const pipDist = dist(landmarks[pipIdx], landmarks[0]);
    return tipDist > pipDist * 1.15;
};

const getGesture = (landmarks, handedness) => {
    // 1. Calculate Normalizers (Palm Breadth)
    // distance from wrist(0) to middle finger mcp(9)
    const palmSize = dist(landmarks[0], landmarks[9]);
    
    // 2. Extension State
    const indexExt = isFingerExtended(landmarks, 8, 6, 0);
    const middleExt = isFingerExtended(landmarks, 12, 10, 0);
    const ringExt = isFingerExtended(landmarks, 16, 14, 0);
    const pinkyExt = isFingerExtended(landmarks, 20, 18, 0);
    
    let thumbExtended = false;
    if (handedness === 'Left') {
        thumbExtended = landmarks[4].x < landmarks[5].x - (palmSize * 0.15); 
    } else {
        thumbExtended = landmarks[4].x > landmarks[5].x + (palmSize * 0.15);
    }
    
    const thumbUp = landmarks[4].y < landmarks[5].y && landmarks[4].y < landmarks[3].y && !indexExt && !middleExt;
    const thumbDown = landmarks[4].y > landmarks[5].y && landmarks[4].y > landmarks[3].y && !indexExt && !middleExt;
    
    const thumbIndexDist = dist(landmarks[4], landmarks[8]);
    
    // Normalized gestures
    if (thumbIndexDist < palmSize * 0.35 && middleExt && ringExt && pinkyExt) return "THANK";
    
    if (indexExt && middleExt && ringExt && pinkyExt) {
        return thumbExtended ? "HELLO" : "FOUR";
    }
    
    if (indexExt && middleExt && ringExt && !pinkyExt) {
        return thumbExtended ? "HAPPY" : "THREE";
    }
    
    if (indexExt && middleExt && !ringExt && !pinkyExt) return (dist(landmarks[8], landmarks[12]) < palmSize * 0.25) ? "NAME" : "V"; 
    if (indexExt && !middleExt && !ringExt && !pinkyExt) return thumbExtended ? "L" : "YOU";
    if (indexExt && !middleExt && !ringExt && pinkyExt) return thumbExtended ? "LOVE" : "ROCK";
    if (!indexExt && !middleExt && !ringExt && pinkyExt) return thumbExtended ? "MY" : "I";
    
    if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
        if (thumbUp) return "GOOD";
        if (thumbDown) return "THUMBS DOWN";
        if (thumbExtended) return "A";
        return "NO"; 
    }
    return "UNKNOWN";
}

function onResults(results) {
    if (!canvasCtx) return;
    resizeCanvas();
    if (canvasElement.width === 0 || canvasElement.height === 0) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    let seenHands = { Left: false, Right: false };

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            const rawLabel = results.multiHandedness[i].label; 
            // MIRROR FIX: Invert polarity because of scaleX(-1) display
            const handLabel = rawLabel === 'Left' ? 'Right' : 'Left';
            
            // Smoothing for Landmark stabilization
            if (!landBuffer[handLabel]) landBuffer[handLabel] = [];
            landBuffer[handLabel].push(landmarks);
            if (landBuffer[handLabel].length > 5) landBuffer[handLabel].shift();
            
            checkLighting(results.image);

            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#22c55e', lineWidth: 4});
            drawLandmarks(canvasCtx, landmarks, {color: '#ffffff', lineWidth: 2, radius: 3});
            
            const detectedGesture = getGesture(landmarks, handLabel);
            updatePrediction(handLabel, detectedGesture);
            seenHands[handLabel] = true;
        }
    }
    
    if (!seenHands.Left) updatePrediction("Left", null);
    if (!seenHands.Right) updatePrediction("Right", null);
    
    canvasCtx.restore();
}

// Communication Logic: Unified Stream (STT + User Chat + System messages)
function showLiveCaptions(text, isMe, isFinal = false) {
    const elId = isMe ? 'local-captions' : 'remote-captions';
    const cap = document.getElementById(elId);
    if (!cap) return;
    
    cap.innerText = text;
    cap.classList.add('active');
    if (!isFinal) cap.classList.add('interim');
    else cap.classList.remove('interim');
    
    clearTimeout(cap.timer);
    if (isFinal) {
        cap.timer = setTimeout(() => cap.classList.remove('active'), 5000);
    }
}

function syncMessageToPeer(text, type = 'chat') {
    if (dataConn && dataConn.open) {
        dataConn.send({ type: type, text: text });
    }
}

// Shows a greyed-out interim/status message at the bottom of the chat panel
function showInterim(text) {
    if (!chatHistory) return;
    if (!interimMsg) {
        interimMsg = document.createElement('div');
        interimMsg.className = 'chat-message interim';
    }
    if (text) {
        interimMsg.innerText = text;
        if (!interimMsg.parentNode) chatHistory.appendChild(interimMsg);
    } else {
        interimMsg.remove();
        interimMsg = null;
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function addChatMessage(sender, text, isVoice = false) {
    if (!chatHistory || !text) return;
    
    const msg = document.createElement('div');
    msg.className = `chat-message ${sender} ${isVoice ? 'voice' : ''}`;
    msg.innerText = text;
    chatHistory.appendChild(msg);
    
    if (interimMsg && interimMsg.parentNode === chatHistory) {
         chatHistory.appendChild(interimMsg);
    }
    chatHistory.scrollTop = chatHistory.scrollHeight;

    if (sender === 'me') {
        syncMessageToPeer(text, isVoice ? 'voice' : 'chat');
        showLiveCaptions(text, true, true);
    } else {
        showLiveCaptions(text, false, true);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Speech-to-Text (STT) System
// ─────────────────────────────────────────────────────────────────────────────

const STTApi = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!STTApi) {
    console.warn('[Signova] Speech Recognition not supported in this browser.');
    if (toggleVoiceText) {
        toggleVoiceText.disabled = true;
        const label = toggleVoiceText.closest('.cyber-toggle')?.querySelector('.toggle-label');
        if (label) label.innerText = 'STT Unsupported';
    }
    if (speakBtn) speakBtn.disabled = true;
} else {
    speechRecognition = new STTApi();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    // lang is synced dynamically before each start() call
}

// ── Shared mic state machine ─────────────────────────────────────────────────
// Single source of truth – both the toggle and the speak-btn call setListening()
function setListening(value) {
    isListening = value;

    // Keep toggle checkbox in sync
    if (toggleVoiceText) toggleVoiceText.checked = value;

    // Update speak-btn icon / glow
    if (speakBtn) {
        if (value) {
            speakBtn.classList.add('mic-active');
            speakBtn.title = 'Stop Microphone';
        } else {
            speakBtn.classList.remove('mic-active');
            speakBtn.title = 'Toggle Microphone';
        }
    }

    // Update toggle label
    const label = toggleVoiceText?.closest('.cyber-toggle')?.querySelector('.toggle-label');
    if (label) {
        if (value) {
            label.innerHTML = '🎤 Listening...';
            label.classList.add('neon-text');
            label.style.textShadow = '0 0 10px #4ade80, 0 0 20px #4ade80';
        } else {
            label.innerHTML = 'Voice &rarr; Text';
            label.classList.remove('neon-text');
            label.style.textShadow = '';
        }
    }

    if (!speechRecognition) return;

    if (value) {
        // Always sync language to current user preference before starting
        speechRecognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
        console.log('[Signova] Mic started | STT lang:', speechRecognition.lang);

        // Explicitly request mic permission first so Chrome doesn't silently block
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                console.log('[Signova] Mic access granted');
                try {
                    speechRecognition.start();
                    showInterim('🎤 Listening...');
                } catch (e) {
                    // already running – fine
                }
            })
            .catch(err => {
                console.error('[Signova] Mic access denied:', err);
                alert('⚠️ Microphone access is required for Voice → Text. Please allow mic access and try again.');
                setListening(false); // roll back state
            });
    } else {
        try { speechRecognition.stop(); } catch (e) {}
        console.log('[Signova] Mic stopped');
        if (chatInput) chatInput.value = '';
        showInterim('');
        const cap = document.getElementById('local-captions');
        if (cap) cap.classList.remove('active');
    }
}

// Wire up events only when API is available
if (speechRecognition) {

    // ── Buffers & timers ──────────────────────────────────────────────────────
    let finalBuffer    = '';   // accumulates isFinal segments
    let speechPauseTimer = null; // commits text after silence

    // Flush buffered speech into the chat stream
    function flushToChat() {
        clearTimeout(speechPauseTimer);
        speechPauseTimer = null;

        let text = '';
        if (finalBuffer.trim()) {
            text = finalBuffer.trim();
        } else if (chatInput && chatInput.value.trim()) {
            text = chatInput.value.trim();
        }

        if (text) {
            addChatMessage('me', text, true);
            console.log('✅ SENT TO CHAT:', text);
        }

        finalBuffer = '';
        if (chatInput) chatInput.value = '';
    }

    // ── onresult ─────────────────────────────────────────────────────────────
    speechRecognition.onresult = (event) => {
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalBuffer += transcript + ' ';
            } else {
                interim += transcript;
            }
        }

        console.log('🎤 Interim:', interim);
        console.log('🎤 Final Buffer:', finalBuffer);

        // Show live typing in the input field
        if (chatInput) chatInput.value = interim;

        // Restart pause timer ONLY — no immediate flush
        clearTimeout(speechPauseTimer);
        speechPauseTimer = setTimeout(flushToChat, 1500);
    };

    // ── onstart ───────────────────────────────────────────────────────────────
    speechRecognition.onstart = () => {
        console.log('[Signova] SpeechRecognition started | lang:', speechRecognition.lang);
    };

    // ── onerror ───────────────────────────────────────────────────────────────
    speechRecognition.onerror = (event) => {
        console.error('[Signova] STT Error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setListening(false);
            showInterim('⚠️ Microphone access denied.');
        }
        // 'no-speech' is normal — pause timer will handle commit & onend restarts
    };

    // ── onend ─────────────────────────────────────────────────────────────────
    // Flush remaining text, then restart if still listening
    speechRecognition.onend = () => {
        flushToChat();

        if (isListening) {
            speechRecognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
            try { speechRecognition.start(); } catch (e) {}
        } else {
            console.log('[Signova] SpeechRecognition ended');
            showInterim('');
        }
    };
}


// ── Toggle listener ──────────────────────────────────────────────────────────
if (toggleVoiceText) {
    toggleVoiceText.addEventListener('change', () => setListening(toggleVoiceText.checked));
}

// Legacy shim so any existing callers of updateSTTState() still work
function updateSTTState() {
    if (toggleVoiceText) setListening(toggleVoiceText.checked);
}


// Cached voice list — populated once voices are ready
let cachedVoices = [];
let hindiVoice = null;

function loadAndCacheVoices() {
    cachedVoices = window.speechSynthesis.getVoices();
    hindiVoice = cachedVoices.find(v => v.lang.startsWith('hi')) || null;
    console.log('[Signova] Voices loaded:', cachedVoices.length, '| Hindi voice:', hindiVoice?.name || 'none – will use hi-IN lang tag');
}

// onvoiceschanged fires asynchronously in most browsers
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadAndCacheVoices;
    loadAndCacheVoices(); // also try immediately (some browsers are sync)
}

function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    if (currentLang === 'hi') {
        utterance.lang = 'hi-IN';
        if (hindiVoice) {
            utterance.voice = hindiVoice;
            utterance.lang  = hindiVoice.lang; // use the exact lang tag the voice reports
        } else {
            console.warn('[Signova] No Hindi voice found – speaking with hi-IN lang tag only.');
        }
    } else {
        utterance.lang = 'en-US';
    }

    console.log('[Signova] Speaking:', text, '| lang:', utterance.lang, '| voice:', utterance.voice?.name || 'default');
    window.speechSynthesis.speak(utterance);
}


// speak-btn directly drives the shared state machine
if (speakBtn) {
    speakBtn.addEventListener('click', () => setListening(!isListening));
}

if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', () => {
        const msg = chatInput.value.trim();
        if (msg) {
            addChatMessage('me', msg);
            chatInput.value = '';
        }
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (chatHistory) {
            chatHistory.innerHTML = '<div class="chat-message system">Channel cleared.</div>';
            interimMsg = null;
            if (isListening && speechRecognition) {
                showInterim('🎤 Listening...');
            }
        }
        buffers.Left.length = 0;
        buffers.Right.length = 0;
        stableGestures.Left = "";
        stableGestures.Right = "";
        setHandOutput("Left", "--");
        setHandOutput("Right", "--");
        window.speechSynthesis.cancel();
    });
}

chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

window.addEventListener('DOMContentLoaded', async () => {
    // Voices are loaded via onvoiceschanged / loadAndCacheVoices above
    if (document.getElementById('input-video')) {
        const stream = await checkSystemHealth();
        if (stream) {
            setupMediaPipe(stream);
            setTimeout(() => updateSTTState(), 1000); 
            initWebRTC();
        }
    }
});

async function checkSystemHealth() {
    const overlay = document.getElementById('system-health-overlay');
    const instruct = document.getElementById('health-instructions');
    const retryBtn = document.getElementById('retry-health-btn');
    
    overlay.classList.remove('hidden');
    
    let allPassed = true;
    let activeStream = null;

    // 1. Check HTTPS
    const isSecure = window.isSecureContext;
    updateHealthStatus('check-https', isSecure ? 'passed' : 'failed', isSecure ? 'SECURE' : 'INSECURE');
    if (!isSecure) {
        allPassed = false;
        instruct.innerHTML += `<p class="warning-text">SIGNOVA requires HTTPS/SSL to access your camera for security. Please use a secure URL.</p>`;
    }

    // 2. Check Permissions & Camera
    try {
        activeStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 1280, height: 720 }, 
            audio: { echoCancellation: true } 
        });
        updateHealthStatus('check-camera-perm', 'passed', 'GRANTED');
    } catch (e) {
        allPassed = false;
        updateHealthStatus('check-camera-perm', 'failed', 'BLOCKED');
        instruct.innerHTML += `<p class="warning-text">Camera access was denied. Click the lock icon in your address bar to reset permissions and try again.</p>`;
        instruct.classList.remove('hidden');
        retryBtn.classList.remove('hidden');
    }

    if (allPassed) {
        setTimeout(() => overlay.classList.add('hidden'), 1000);
        return activeStream;
    }
    
    return null;
}

function updateHealthStatus(id, result, text) {
    const item = document.getElementById(id);
    if (!item) return;
    item.className = `health-item ${result}`;
    const status = item.querySelector('.health-status');
    if (status) {
        status.innerText = text;
        status.className = `health-status ${result}`;
    }
}

document.getElementById('retry-health-btn')?.addEventListener('click', () => window.location.reload());

// ---------- WebRTC Implementation (PeerJS) ----------

function initWebRTC() {
    peer = new Peer({
        config: { iceServers: ICE_SERVERS }
    });

    peer.on('open', (id) => {
        console.log('My Peer ID:', id);
        if (myPeerIdDisplay) myPeerIdDisplay.innerText = id;
        if (connectionStatus) connectionStatus.innerText = "READY FOR CALL";
    });

    peer.on('call', (call) => {
        console.log('Incoming call...');
        if (!localStream) {
            setupStreamAndAnswer(call);
        } else {
            call.answer(localStream);
            handleCall(call);
        }
    });

    peer.on('connection', (conn) => {
        console.log('Inbound Data Connection established');
        setupDataConnection(conn);
    });

    peer.on('error', (err) => {
        console.error('PeerJS Error:', err);
        if (connectionStatus) connectionStatus.innerText = "CONNECTION ERROR";
    });

    // Control Handlers
    if (callBtn) {
        callBtn.addEventListener('click', () => {
            const remoteId = remotePeerIdInput.value.trim();
            if (remoteId) initiateCall(remoteId);
        });
    }

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            console.log("Skipping to next partner...");
            handleCallClosed();
        });
    }

    const mobileJoinBtn = document.getElementById('mobile-join-btn');
    if (mobileJoinBtn) {
        mobileJoinBtn.addEventListener('click', () => {
            if (remoteVideoElement) remoteVideoElement.play();
            if (videoElement) videoElement.play();
            document.getElementById('mobile-start-overlay').classList.add('hidden');
        });
    }

    if (copyIdBtn) {
        copyIdBtn.addEventListener('click', () => {
            const id = myPeerIdDisplay.innerText;
            navigator.clipboard.writeText(id);
            copyIdBtn.innerHTML = '<i data-lucide="check"></i>';
            setTimeout(() => {
                copyIdBtn.innerHTML = '<i data-lucide="copy"></i>';
                lucide.createIcons();
            }, 2000);
            lucide.createIcons();
        });
    }

    const endCallBtn = document.getElementById('end-call-btn');
    if (endCallBtn) {
        endCallBtn.addEventListener('click', (e) => {
            // If they are just clicking to go back, we don't want to prevent navigation, 
            // but we do want to close connections.
            if (currentCall) currentCall.close();
            if (dataConn) dataConn.close();
        });
    }
}

async function setupStreamAndAnswer(call) {
    // If stream not ready, wait a bit or try to get it
    if (!localStream) {
        localStream = videoElement.captureStream ? videoElement.captureStream() : videoElement.mozCaptureStream();
    }
    call.answer(localStream);
    handleCall(call);
}

function initiateCall(remoteId) {
    if (!localStream) {
        localStream = videoElement.captureStream ? videoElement.captureStream() : videoElement.mozCaptureStream();
    }
    
    // 1. Media Call
    const call = peer.call(remoteId, localStream);
    handleCall(call);

    // 2. Data Connection
    const conn = peer.connect(remoteId);
    setupDataConnection(conn);
}

function handleCall(call) {
    currentCall = call;
    if (connectionStatus) {
        connectionStatus.innerText = "CONNECTING...";
        connectionStatus.classList.add('pulse-glow');
    }

    call.on('stream', (remoteStream) => {
        console.log('Received remote stream');
        if (remoteVideoElement) {
            remoteVideoElement.srcObject = remoteStream;
            
            remoteVideoElement.play().catch(err => {
                console.warn("Autoplay blocked.");
            });

            if (connectionOverlay) connectionOverlay.classList.add('connected');
            if (connectionStatus) connectionStatus.innerText = "CONNECTED";
            isBusy = true;
            lucide.createIcons();
        }
    });

    call.on('close', () => {
        handleCallClosed();
    });
}

function setupDataConnection(conn) {
    dataConn = conn;
    
    conn.on('data', (data) => {
        if (data.type === 'chat' || data.type === 'voice') {
            addChatMessage('them', data.text, data.type === 'voice');
            showLiveCaptions(data.text, false, true);
        } else if (data.type === 'voice_interim') {
            showLiveCaptions(data.text, false, false);
        } else if (data.type === 'gesture') {
            updateRemoteGesture(data.hand, data.text, data.isPhrase);
        }
    });

    conn.on('open', () => {
        console.log('Secure Data Channel Open');
        if (connectionOverlay) connectionOverlay.classList.add('connected');
    });

    conn.on('close', () => {
        handleCallClosed();
    });
}

function updateRemoteGesture(hand, text, isPhrase) {
    const el = hand === 'Left' ? remoteLeftOutput : remoteRightOutput;
    if (el) {
        el.innerText = text;
        if (isPhrase) {
            el.classList.add('phrase-mode');
            // Remote phrases also get TTS if toggled (optional, but better UX)
            if (toggleSignVoice && toggleSignVoice.checked) {
                speakText(text);
            }
        } else {
            el.classList.remove('phrase-mode');
        }
        
        // Remote cleanup
        setTimeout(() => {
            if (el.innerText === text) {
                el.innerText = "--";
                el.classList.remove('phrase-mode');
            }
        }, isPhrase ? 3000 : 2000);
    }
}

function handleCallClosed() {
    // Force disconnect
    if (currentCall) {
        currentCall.close();
        currentCall = null;
    }
    if (dataConn) {
        dataConn.close();
        dataConn = null;
    }

    if (connectionOverlay) connectionOverlay.classList.remove('connected');
    if (connectionStatus) connectionStatus.innerText = "FINDING NEXT PARTNER...";
    if (remoteVideoElement) remoteVideoElement.srcObject = null;
    
    isBusy = false;
    
    // Update lobby I'm back to free
    if (peer && peer.id) {
        lobby.get(peer.id).put({ id: peer.id, status: 'free', time: Date.now() });
    }
    
    setTimeout(() => {
        if (connectionStatus) connectionStatus.innerText = "FINDING PARTNER...";
    }, 1500);
}

// Cleanup: Mark offline when tab is closed
window.addEventListener('beforeunload', () => {
    if (peer && peer.id) {
        lobby.get(peer.id).put({ status: 'offline', time: Date.now() });
    }
});