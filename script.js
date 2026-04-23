const STORAGE_KEY = "yardCheckState";
const CATEGORIES = ["loaded", "empty", "docked", "redline"];

const CATEGORY_KEYWORDS = {
    loaded: ["loaded", "load", "full"],
    empty: ["empty", "mt", "emty"],
    docked: ["docked", "dock", "dot"],
    redline: ["redline", "red line", "red", "bad order", "out of service", "oos"],
};

const state = loadState();

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const transcriptEl = document.getElementById("transcript");
const clearAllBtn = document.getElementById("clearAllBtn");
const emailBtn = document.getElementById("emailBtn");
const dateEl = document.getElementById("currentDate");

dateEl.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
});

renderAll();

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let shouldBeListening = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
                processUtterance(text);
            } else {
                interim += text;
            }
        }
        if (interim) {
            transcriptEl.textContent = interim;
        }
    };

    recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        setStatus(`Error: ${event.error}`, "error");
    };

    recognition.onend = () => {
        if (shouldBeListening) {
            try { recognition.start(); } catch (e) { /* already started */ }
        } else {
            setStatus("Ready to listen");
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    };
} else {
    setStatus("Speech recognition not supported in this browser", "error");
    startBtn.disabled = true;
}

startBtn.addEventListener("click", () => {
    if (!recognition) return;
    shouldBeListening = true;
    try {
        recognition.start();
        setStatus("🎤 Listening...", "listening");
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } catch (e) {
        setStatus(`Could not start: ${e.message}`, "error");
    }
});

stopBtn.addEventListener("click", () => {
    shouldBeListening = false;
    if (recognition) recognition.stop();
    stopBtn.disabled = true;
    startBtn.disabled = false;
    setStatus("Stopped");
});

clearAllBtn.addEventListener("click", () => {
    if (!confirm("Clear all trailers from every category?")) return;
    CATEGORIES.forEach((c) => { state[c] = []; });
    saveState();
    renderAll();
});

emailBtn.addEventListener("click", sendEmailReport);

function setStatus(msg, cls) {
    statusEl.textContent = msg;
    statusEl.className = "status" + (cls ? " " + cls : "");
}

function processUtterance(text) {
    transcriptEl.textContent = text;
    const lower = text.toLowerCase();

    const category = detectCategory(lower);
    const numbers = extractTrailerNumbers(lower);

    if (!numbers.length) return;

    if (category) {
        numbers.forEach((num) => addTrailer(num, category));
    }
}

function detectCategory(text) {
    for (const cat of CATEGORIES) {
        for (const keyword of CATEGORY_KEYWORDS[cat]) {
            const pattern = new RegExp(`\\b${keyword}\\b`);
            if (pattern.test(text)) return cat;
        }
    }
    return null;
}

function extractTrailerNumbers(text) {
    const cleaned = wordsToDigits(text);
    const matches = cleaned.match(/\b\d{2,6}\b/g) || [];
    return [...new Set(matches)];
}

function wordsToDigits(text) {
    const map = {
        zero: "0", oh: "0", one: "1", two: "2", to: "2", too: "2",
        three: "3", four: "4", for: "4", five: "5", six: "6",
        seven: "7", eight: "8", ate: "8", nine: "9",
    };
    return text
        .split(/\s+/)
        .map((w) => {
            const clean = w.replace(/[^a-z0-9]/gi, "");
            return map[clean] !== undefined ? map[clean] : w;
        })
        .join(" ")
        .replace(/(\d)\s+(?=\d)/g, "$1");
}

function addTrailer(number, category) {
    for (const cat of CATEGORIES) {
        state[cat] = state[cat].filter((n) => n !== number);
    }
    state[category].push(number);
    saveState();
    renderCategory(category);
    CATEGORIES.filter((c) => c !== category).forEach(renderCategory);
}

function removeTrailer(number, category) {
    state[category] = state[category].filter((n) => n !== number);
    saveState();
    renderCategory(category);
}

function renderAll() {
    CATEGORIES.forEach(renderCategory);
}

function renderCategory(category) {
    const container = document.getElementById(category);
    if (!container) return;
    container.innerHTML = "";
    state[category].forEach((num) => {
        const chip = document.createElement("div");
        chip.className = "trailer-chip";
        chip.innerHTML = `<span>${num}</span>`;
        const btn = document.createElement("button");
        btn.className = "remove";
        btn.textContent = "×";
        btn.title = "Remove";
        btn.addEventListener("click", () => removeTrailer(num, category));
        chip.appendChild(btn);
        container.appendChild(chip);
    });
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return blankState();
        const parsed = JSON.parse(raw);
        if (parsed.date !== todayKey()) return blankState();
        return { ...blankState(), ...parsed };
    } catch (e) {
        return blankState();
    }
}

function saveState() {
    const toSave = { date: todayKey() };
    CATEGORIES.forEach((c) => { toSave[c] = state[c]; });
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) { /* ignore quota errors */ }
}

function blankState() {
    const s = { date: todayKey() };
    CATEGORIES.forEach((c) => { s[c] = []; });
    return s;
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

function sendEmailReport() {
    const date = new Date().toLocaleDateString();
    const subject = `Yard Check Report - ${date}`;

    const lines = [`YARD CHECK REPORT`, `Date: ${date}`, ""];
    const labels = {
        loaded: "LOADED",
        empty: "EMPTY",
        docked: "DOCKED",
        redline: "REDLINE",
    };
    let total = 0;
    CATEGORIES.forEach((cat) => {
        const list = state[cat];
        total += list.length;
        lines.push(`${labels[cat]} (${list.length}):`);
        lines.push(list.length ? list.join(", ") : "  (none)");
        lines.push("");
    });
    lines.push(`TOTAL TRAILERS: ${total}`);

    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
}
