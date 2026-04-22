const CATEGORIES = ['loaded', 'empty', 'docked', 'redline'];
const STORAGE_KEY = 'yardcheck-v1';

const WORD_NUMBERS = {
    zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9'
};

const state = load() || {
    loaded: [], empty: [], docked: [], redline: [],
    currentCategory: null
};

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ----- UI -----
const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');
const transcriptEl = document.getElementById('transcript');
const currentCatEl = document.getElementById('currentCategory');
const dateEl = document.getElementById('currentDate');

dateEl.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

function render() {
    for (const cat of CATEGORIES) {
        const list = document.getElementById(cat);
        const count = document.getElementById(cat + '-count');
        list.innerHTML = '';
        for (const num of state[cat]) {
            const chip = document.createElement('span');
            chip.className = 'trailer-chip';
            chip.innerHTML = `${num}<button aria-label="remove ${num}">×</button>`;
            chip.querySelector('button').addEventListener('click', () => {
                state[cat] = state[cat].filter(n => n !== num);
                save();
                render();
            });
            list.appendChild(chip);
        }
        count.textContent = state[cat].length;
        document.querySelector(`.category[data-cat="${cat}"]`)
            .classList.toggle('active', state.currentCategory === cat);
    }
    currentCatEl.textContent = state.currentCategory
        ? `Current: ${state.currentCategory.toUpperCase()}`
        : 'Say a category (e.g. "loaded 4471") or "switch to loaded"';
}

function addTrailer(cat, num) {
    if (!CATEGORIES.includes(cat) || !num) return;
    // remove from other categories first (moves trailer if status changed)
    for (const c of CATEGORIES) {
        state[c] = state[c].filter(n => n !== num);
    }
    state[cat].push(num);
    save();
    render();
}

// ----- Parser -----
// Handles:
//  "loaded 4471"
//  "empty 229 5502"
//  "switch to loaded"
//  bare numbers if a current category is set
//  word-digits like "four four seven one"
function parseTranscript(text) {
    const lower = text.toLowerCase().trim();
    if (!lower) return;

    // Normalize word-digits into digits
    const normalized = lower.replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g,
        w => WORD_NUMBERS[w]);

    // Tokenize on non-alphanumerics
    const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean);

    let i = 0;
    let current = state.currentCategory;

    while (i < tokens.length) {
        const t = tokens[i];

        // "switch to X" or "switch X"
        if (t === 'switch' || t === 'change' || t === 'set') {
            let j = i + 1;
            if (tokens[j] === 'to' || tokens[j] === 'category') j++;
            if (CATEGORIES.includes(tokens[j])) {
                current = tokens[j];
                state.currentCategory = current;
                i = j + 1;
                continue;
            }
            i++;
            continue;
        }

        // "delete 4471" / "remove 4471"
        if (t === 'delete' || t === 'remove') {
            let j = i + 1;
            const maybe = collectNumber(tokens, j);
            if (maybe.num) {
                for (const c of CATEGORIES) {
                    state[c] = state[c].filter(n => n !== maybe.num);
                }
                i = maybe.nextIndex;
                continue;
            }
            i++;
            continue;
        }

        // Category keyword
        if (CATEGORIES.includes(t)) {
            current = t;
            state.currentCategory = current;
            i++;
            continue;
        }

        // Digit token → combine consecutive digit tokens into one trailer number
        if (/^\d+$/.test(t)) {
            const combined = collectNumber(tokens, i);
            if (combined.num && current) {
                addTrailer(current, combined.num);
            }
            i = combined.nextIndex;
            continue;
        }

        i++;
    }
    save();
    render();
}

// Collect consecutive digit tokens and join them. "four four seven one" → "4471"
// Also accepts a single multi-digit token like "4471".
function collectNumber(tokens, start) {
    const parts = [];
    let i = start;
    while (i < tokens.length && /^\d+$/.test(tokens[i])) {
        parts.push(tokens[i]);
        i++;
    }
    // If there are multiple single-digit tokens, join them. Otherwise use the first.
    let num = '';
    if (parts.length === 0) return { num: '', nextIndex: start + 1 };
    if (parts.length === 1) {
        num = parts[0];
    } else if (parts.every(p => p.length === 1)) {
        num = parts.join('');
    } else {
        // Mixed — treat first as the trailer and let next loop iter handle the rest
        num = parts[0];
        return { num, nextIndex: start + 1 };
    }
    return { num, nextIndex: i };
}

// ----- Speech Recognition -----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;
let wantListening = false;

function initRecognition() {
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';

    let finalBuffer = '';

    r.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) {
                finalBuffer = res[0].transcript;
                parseTranscript(finalBuffer);
                transcriptEl.textContent = '"' + finalBuffer.trim() + '"';
            } else {
                interim += res[0].transcript;
            }
        }
        if (interim) transcriptEl.textContent = '… ' + interim;
    };

    r.onerror = (e) => {
        statusEl.textContent = 'Mic error: ' + e.error;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            wantListening = false;
            setListeningUI(false);
        }
    };

    r.onend = () => {
        listening = false;
        // Auto-restart if user still wants to listen (phones often stop after silence)
        if (wantListening) {
            try { r.start(); listening = true; } catch {}
        } else {
            setListeningUI(false);
        }
    };

    return r;
}

function setListeningUI(on) {
    startBtn.classList.toggle('listening', on);
    startBtn.textContent = on ? 'STOP' : 'START';
    statusEl.textContent = on ? 'Listening…' : 'Tap START and speak';
}

startBtn.addEventListener('click', () => {
    if (!SpeechRecognition) {
        alert('Voice recognition is not supported in this browser. Use Chrome on Android or Safari on iOS 14.5+.');
        return;
    }
    if (!recognition) recognition = initRecognition();

    if (listening || wantListening) {
        wantListening = false;
        try { recognition.stop(); } catch {}
        setListeningUI(false);
    } else {
        wantListening = true;
        try {
            recognition.start();
            listening = true;
            setListeningUI(true);
        } catch (err) {
            statusEl.textContent = 'Could not start mic: ' + err.message;
        }
    }
});

document.getElementById('clearAllBtn').addEventListener('click', () => {
    if (!confirm('Clear all trailers?')) return;
    for (const c of CATEGORIES) state[c] = [];
    state.currentCategory = null;
    save();
    render();
});

document.getElementById('emailBtn').addEventListener('click', async () => {
    const report = buildReport();
    const emailBtn = document.getElementById('emailBtn');
    const original = emailBtn.textContent;
    emailBtn.textContent = 'Sending…';
    emailBtn.disabled = true;
    try {
        const res = await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report, date: new Date().toISOString() })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            alert('Report emailed!');
        } else if (res.status === 404) {
            // No serverless endpoint (running locally on a static server). Use mailto.
            mailtoFallback(report);
        } else {
            alert('Email failed: ' + (data.error || res.statusText));
        }
    } catch (err) {
        mailtoFallback(report);
    } finally {
        emailBtn.textContent = original;
        emailBtn.disabled = false;
    }
});

function mailtoFallback(report) {
    const body = encodeURIComponent(report);
    const subj = encodeURIComponent('Yard Check - ' + new Date().toLocaleDateString());
    window.location.href = `mailto:?subject=${subj}&body=${body}`;
}

function buildReport() {
    const dateStr = new Date().toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const lines = [`YARD CHECK — ${dateStr}`, ''];
    for (const cat of CATEGORIES) {
        lines.push(cat.toUpperCase() + ` (${state[cat].length})`);
        lines.push(state[cat].length ? state[cat].join(', ') : '—');
        lines.push('');
    }
    return lines.join('\n');
}

render();
