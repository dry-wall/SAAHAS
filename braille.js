
const braille = {
    "a": ["f"],                     // 1
    "b": ["f", "d"],                 // 1 2
    "c": ["f", "j"],                 // 1 4
    "d": ["f", "j", "k"],             // 1 4 5
    "e": ["f", "k"],                 // 1 5
    "f": ["f", "d", "j"],             // 1 2 4
    "g": ["f", "d", "j", "k"],         // 1 2 4 5
    "h": ["f", "d", "k"],             // 1 2 5  
    "i": ["d", "j"],                 // 2 4
    "j": ["d", "j", "k"],             // 2 4 5

    "k": ["f", "s"],                 // 1 3
    "l": ["f", "d", "s"],             // 1 2 3
    "m": ["f", "s", "j"],             // 1 3 4
    "n": ["f", "s", "j", "k"],         // 1 3 4 5
    "o": ["f", "s", "k"],             // 1 3 5
    "p": ["f", "d", "s", "j"],         // 1 2 3 4
    "q": ["f", "d", "s", "j", "k"],     // 1 2 3 4 5
    "r": ["f", "d", "s", "k"],         // 1 2 3 5
    "s": ["d", "s", "j"],             // 2 3 4
    "t": ["d", "s", "j", "k"],         // 2 3 4 5

    "u": ["f", "s", "l"],             // 1 3 6
    "v": ["f", "d", "s", "l"],         // 1 2 3 6
    "w": ["d", "j", "k", "l"],         // 2 4 5 6
    "x": ["f", "s", "j", "l"],         // 1 3 4 6
    "y": ["f", "s", "j", "k", "l"],     // 1 3 4 5 6
    "z": ["f", "s", "k", "l"]          // 1 3 5 6
};


const allowedKeys = ["f", "d", "s", "j", "k", "l"];
const allowedSet = new Set(allowedKeys);

const ctx = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq, duration) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), duration);
}

function smallBeep() { beep(700, 100); }
function longBeep() { beep(300, 400); }

function wait(ms) {
    return new Promise(res => setTimeout(res, ms));
}


async function processCharacter(ch) {
    ch = ch.toLowerCase();

    if (!braille[ch]) {
        await wait(300);
        return;
    }

    const required = new Set(braille[ch]);
    const pressed = new Set();

    console.log("Character:", ch.toUpperCase());
    console.log("Required dots:", [...required]);

    return new Promise(resolve => {

        function onKey(event) {
            const key = event.key.toLowerCase();

            if (!allowedSet.has(key)) return;


            if (pressed.has(key)) return;

            pressed.add(key);

            if (required.has(key)) {
                smallBeep();
                logToUI(`Correct dot: ${key.toUpperCase()}`, "correct");
            } else {
                longBeep();
                logToUI(`Wrong dot: ${key.toUpperCase()}`, "wrong");
            }


            if (pressed.size === 6) {
                // Remove listener from the specific element
                brailleInput.removeEventListener("keydown", onKey);
                setTimeout(resolve, 300);
            }
        }

        // Attach listener to the specific element instead of window
        const brailleInput = document.getElementById("braille-input");
        brailleInput.addEventListener("keydown", onKey);
    });
}


async function startTraining() {
    const textInput = document.getElementById("textInput");
    const text = textInput.value;

    if (!text) return; // Don't start if empty

    // UI Switching
    document.getElementById("setup-section").classList.add("hidden");
    document.getElementById("practice-section").classList.remove("hidden");

    // Focus the braille input area
    const brailleInput = document.getElementById("braille-input");
    brailleInput.focus();
    brailleInput.innerText = "Type now...";

    console.log("\n--- START ---");

    const statusDisplay = document.getElementById("status-display");

    // Generate guide on start
    generateMappingGuide();
    logToUI("Starting training session...", "info");

    for (const ch of text) {
        statusDisplay.innerText = `Type: ${ch.toUpperCase()}`;
        logToUI(`Waiting for character: ${ch.toUpperCase()}`, "info");
        await processCharacter(ch);
        // Clear input visual feedback after each char if we wanted to, but for now just loop
        brailleInput.innerText = "Good! Next...";
        logToUI(`Completed: ${ch.toUpperCase()}`, "correct");
    }

    statusDisplay.innerText = "Finished!";
    brailleInput.innerText = "Click to restart";
    brailleInput.onclick = () => location.reload();

    logToUI("Session finished.", "info");
    console.log("Finished.");
}

function logToUI(msg, type = "neutral") {
    const logContainer = document.getElementById("log-content");
    if (!logContainer) return;
    const entry = document.createElement("div");
    entry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString().split(" ")[0];
    entry.innerText = `[${timestamp}] ${msg}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
    console.log(msg);
}

function generateMappingGuide() {
    const guideContainer = document.getElementById("guide-content");
    if (!guideContainer) return;
    guideContainer.innerHTML = "";

    Object.keys(braille).sort().forEach(char => {
        const keys = braille[char];
        const item = document.createElement("div");
        item.className = "guide-item";

        const charEl = document.createElement("div");
        charEl.className = "guide-char";
        charEl.innerText = char.toUpperCase();

        const keyEl = document.createElement("div");
        keyEl.className = "guide-keys";
        keyEl.innerText = keys.join(" ").toUpperCase();

        item.appendChild(charEl);
        item.appendChild(keyEl);
        guideContainer.appendChild(item);
    });
}