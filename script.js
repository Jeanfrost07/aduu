// Calculator State
const state = {
    current: '0',
    previous: null,
    operator: null,
    waitingForOperand: false,
    history: ''
};

// DOM Elements
const currentDisplay = document.getElementById('current');
const historyDisplay = document.getElementById('history');
const buttons = document.querySelector('.buttons');

// Initialize
function init() {
    updateDisplay();
    bindEvents();
    bindKeyboard();
}

// Event Binding
function bindEvents() {
    buttons.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;

        if (btn.dataset.value !== undefined) {
            inputNumber(btn.dataset.value);
        } else if (btn.dataset.action) {
            handleAction(btn.dataset.action);
        }
        updateDisplay();
    });
}

// Keyboard Support
function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        if (key >= '0' && key <= '9') {
            inputNumber(key);
        } else if (key === '.') {
            inputNumber('.');
        } else if (key === '+' || key === '-') {
            handleAction(key === '+' ? 'add' : 'subtract');
        } else if (key === '*') {
            handleAction('multiply');
        } else if (key === '/') {
            e.preventDefault();
            handleAction('divide');
        } else if (key === '%') {
            handleAction('percent');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            handleAction('equals');
        } else if (key === 'Escape' || key === 'c' || key === 'C') {
            handleAction('clear');
        } else if (key === 'Backspace') {
            handleAction('delete');
        }
        updateDisplay();
    });
}

// Number Input
function inputNumber(num) {
    if (state.waitingForOperand) {
        state.current = num === '.' ? '0.' : num;
        state.waitingForOperand = false;
    } else {
        if (num === '.' && state.current.includes('.')) return;
        if (state.current === '0' && num !== '.') {
            state.current = num;
        } else {
            state.current += num;
        }
    }
}

// Actions
function handleAction(action) {
    switch (action) {
        case 'clear':
            clear();
            break;
        case 'delete':
            deleteLast();
            break;
        case 'percent':
            percent();
            break;
        case 'add':
        case 'subtract':
        case 'multiply':
        case 'divide':
            setOperator(action);
            break;
        case 'equals':
            calculate();
            break;
    }
}

// Clear All
function clear() {
    state.current = '0';
    state.previous = null;
    state.operator = null;
    state.waitingForOperand = false;
    state.history = '';
    clearActiveOperator();
}

// Delete Last Digit
function deleteLast() {
    if (state.waitingForOperand) return;
    if (state.current.length <= 1 || (state.current.length === 2 && state.current.startsWith('-'))) {
        state.current = '0';
    } else {
        state.current = state.current.slice(0, -1);
    }
}

// Percentage
function percent() {
    const value = parseFloat(state.current);
    if (!isNaN(value)) {
        state.current = formatNumber(value / 100);
    }
}

// Set Operator
function setOperator(op) {
    const operatorSymbols = {
        add: '+',
        subtract: '−',
        multiply: '×',
        divide: '÷'
    };

    const currentValue = parseFloat(state.current);

    if (state.previous !== null && state.operator && !state.waitingForOperand) {
        calculate();
    }

    state.operator = op;
    state.previous = currentValue;
    state.waitingForOperand = true;
    state.history = `${formatNumber(state.previous)} ${operatorSymbols[op]}`;

    // Visual feedback
    clearActiveOperator();
    const opBtn = document.querySelector(`.btn.operator[data-action="${op}"]`);
    if (opBtn) opBtn.classList.add('active');
}

// Calculate Result
function calculate() {
    if (state.operator === null || state.previous === null || state.waitingForOperand) return;

    const prev = state.previous;
    const current = parseFloat(state.current);
    let result;

    try {
        switch (state.operator) {
            case 'add':
                result = prev + current;
                break;
            case 'subtract':
                result = prev - current;
                break;
            case 'multiply':
                result = prev * current;
                break;
            case 'divide':
                if (current === 0) throw new Error('Cannot divide by zero');
                result = prev / current;
                break;
        }

        state.history = `${formatNumber(prev)} ${getOperatorSymbol(state.operator)} ${formatNumber(current)} =`;
        state.current = formatNumber(result);
        state.previous = null;
        state.operator = null;
        state.waitingForOperand = true;

        clearActiveOperator();
    } catch (error) {
        state.current = 'Error';
        state.waitingForOperand = true;
        setTimeout(() => {
            state.current = '0';
            updateDisplay();
        }, 1500);
    }
}

// Helpers
function getOperatorSymbol(op) {
    const symbols = { add: '+', subtract: '−', multiply: '×', divide: '÷' };
    return symbols[op] || '';
}

function formatNumber(num) {
    if (!isFinite(num)) return 'Error';

    const str = num.toString();
    if (str.includes('e')) {
        return num.toPrecision(10).replace(/\.?0+$/, '');
    }

    const [intPart, decPart] = str.split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (decPart !== undefined) {
        // Limit decimal places to prevent overflow
        const limitedDec = decPart.slice(0, 10);
        return `${formattedInt}.${limitedDec}`;
    }
    return formattedInt;
}

function clearActiveOperator() {
    document.querySelectorAll('.btn.operator.active').forEach(btn => {
        btn.classList.remove('active');
    });
}

function updateDisplay() {
    currentDisplay.textContent = state.current;
    historyDisplay.textContent = state.history;

    // Animation on number change
    currentDisplay.classList.remove('pressed');
    void currentDisplay.offsetWidth; // Force reflow
    currentDisplay.classList.add('pressed');
}

// Initialize on DOM ready
if (document.readyState !== 'loading') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}