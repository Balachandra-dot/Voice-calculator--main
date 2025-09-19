const startBtn = document.getElementById('start-btn');
const display = document.getElementById('display');
const result = document.getElementById('result');
const input = document.getElementById('input');
const calcBtn = document.getElementById('calc-btn');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const historyList = document.getElementById('history-list');
const continuousToggle = document.getElementById('continuous-toggle');

const history = [];

function addToHistory(expression, value) {
    if (expression === '' || value === undefined || Number.isNaN(value)) return;
    history.unshift({ expression, value });
    if (history.length > 20) history.pop();
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    history.forEach((h, idx) => {
        const li = document.createElement('li');
        const exprSpan = document.createElement('span');
        exprSpan.className = 'expr';
        exprSpan.textContent = h.expression;
        const valueSpan = document.createElement('span');
        valueSpan.className = 'value';
        valueSpan.textContent = h.value;
        li.appendChild(exprSpan);
        li.appendChild(valueSpan);
        li.title = 'Click to reuse';
        li.style.cursor = 'pointer';
        li.onclick = () => {
            input.value = h.expression;
            display.textContent = 'Expression: ' + h.expression;
            result.textContent = 'Result: ' + h.value;
        };
        historyList.appendChild(li);
    });
}

function normalizeSpeech(text) {
    if (!text) return '';
    let t = ' ' + text.toLowerCase() + ' ';
    // numbers words basic (optional)
    const numberWords = {
        zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
        six: '6', seven: '7', eight: '8', nine: '9', ten: '10'
    };
    Object.keys(numberWords).forEach(w => {
        t = t.replace(new RegExp(' ' + w + ' ', 'g'), ' ' + numberWords[w] + ' ');
    });

    t = t
        .replace(/plus/g, '+')
        .replace(/minus/g, '-')
        .replace(/times|multiplied by|into/g, '*')
        .replace(/divided by|over/g, '/')
        .replace(/power of|to the power of|raised to/g, '^')
        .replace(/modulo|mod/g, '%')
        .replace(/open parenthesis|open bracket/g, '(')
        .replace(/close parenthesis|close bracket/g, ')')
        .replace(/percent/g, '%')
        .replace(/pi/g, '3.141592653589793');

    // remove any characters not allowed
    t = t.replace(/[^0-9+\-*/().%^\s]/g, '');
    return t.trim();
}

function safeEvaluate(expr) {
    if (!expr) return undefined;
    // support ^ as exponent
    const jsExpr = expr.replace(/\^/g, '**');
    // disallow consecutive operators common errors
    if (/[^\d)]+$/.test(jsExpr)) return undefined;
    try {
        // eslint-disable-next-line no-eval
        const val = eval(jsExpr);
        return typeof val === 'number' && Number.isFinite(val) ? val : undefined;
    } catch (_e) {
        return undefined;
    }
}

function evaluateAndShow(rawExpr) {
    const expr = rawExpr || input.value;
    display.textContent = 'Expression: ' + (expr || '');
    const value = safeEvaluate(expr);
    if (value === undefined) {
        result.textContent = 'Invalid expression!';
        return;
    }
    result.textContent = 'Result: ' + value;
    addToHistory(expr, value);
}

calcBtn.onclick = () => evaluateAndShow();
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        evaluateAndShow();
    }
});

clearBtn.onclick = () => {
    input.value = '';
    display.textContent = '';
    result.textContent = '';
};

copyBtn.onclick = async () => {
    const text = result.textContent.replace(/^Result:\s*/, '');
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
    } catch (_e) {}
};

window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (window.SpeechRecognition) {
    const recognition = new window.SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    startBtn.onclick = () => {
        recognition.continuous = !!continuousToggle.checked;
        recognition.start();
    };

    recognition.onresult = function(event) {
        const res = event.results;
        const last = res[res.length - 1];
        const transcript = last && last[0] ? last[0].transcript : '';
        const normalized = normalizeSpeech(transcript);
        input.value = normalized;
        evaluateAndShow(normalized);
    };

    recognition.onerror = function(event) {
        result.textContent = "Error: " + event.error;
    };

    recognition.onend = function() {
        if (continuousToggle.checked) {
            recognition.start();
        }
    };
} else {
    display.textContent = "Speech Recognition not supported in this browser.";
    }
