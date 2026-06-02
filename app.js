/* ===== State ===== */
const DEFAULT_STATE = {
  days: 3,
  variable: {
    accommodation: 150,
    food: 80,
    transportation: 30,
    funMoney: 50,
  },
  fixed: {
    flights: 600,
    fixedMisc: 0,
  },
};

let state = {};
const STORAGE_KEY = 'tripcalc_state';

/* ===== DOM Cache ===== */
const $ = (id) => document.getElementById(id);

const daysInput = $('days-input');
const daysMinus = $('days-minus');
const daysPlus = $('days-plus');

const variableInputs = {
  accommodation: $('input-accommodation'),
  food: $('input-food'),
  transportation: $('input-transportation'),
  funMoney: $('input-funMoney'),
};

const fixedInputs = {
  flights: $('input-flights'),
  fixedMisc: $('input-fixedMisc'),
};

const resultEls = {
  accommodation: $('result-accommodation'),
  food: $('result-food'),
  transportation: $('result-transportation'),
  funMoney: $('result-funMoney'),
  flights: $('result-flights'),
  fixedMisc: $('result-fixedMisc'),
};

const perDayTotalEl = $('per-day-total');
const totalVariableEl = $('total-variable');
const totalFixedEl = $('total-fixed');
const summaryVariableEl = $('summary-variable');
const summaryFixedEl = $('summary-fixed');
const grandTotalEl = $('grand-total');
const resetBtn = $('reset-btn');

/* ===== Currency Formatting ===== */
const CURRENCY = 'RM';

function fmt(val) {
  return `${CURRENCY} ${Number(val).toLocaleString('en-MY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ===== Storage ===== */
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only keep known keys from defaults, fill in any missing
      state = clone(DEFAULT_STATE);
      if (typeof parsed.days === 'number' && parsed.days >= 1) {
        state.days = parsed.days;
      }
      if (parsed.variable && typeof parsed.variable === 'object') {
        for (const key of Object.keys(state.variable)) {
          if (typeof parsed.variable[key] === 'number') {
            state.variable[key] = parsed.variable[key];
          }
        }
      }
      if (parsed.fixed && typeof parsed.fixed === 'object') {
        for (const key of Object.keys(state.fixed)) {
          if (typeof parsed.fixed[key] === 'number') {
            state.fixed[key] = parsed.fixed[key];
          }
        }
      }
      return;
    }
  } catch (_) {
    // ignore corrupt storage
  }
  state = clone(DEFAULT_STATE);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    // storage full or unavailable
  }
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function mergeDeep(target, source) {
  const result = clone(target);
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/* ===== Calculations ===== */
function calculate() {
  const days = state.days;

  // Variable totals
  let totalVariable = 0;
  for (const [key, value] of Object.entries(state.variable)) {
    const subtotal = value * days;
    totalVariable += subtotal;
    if (resultEls[key]) {
      resultEls[key].textContent = fmt(subtotal);
    }
  }

  // Per-day total
  const perDay = Object.values(state.variable).reduce((sum, v) => sum + v, 0);
  if (perDayTotalEl) {
    perDayTotalEl.textContent = fmt(perDay);
  }

  // Fixed totals
  let totalFixed = 0;
  for (const [key, value] of Object.entries(state.fixed)) {
    totalFixed += value;
    if (resultEls[key]) {
      resultEls[key].textContent = fmt(value);
    }
  }

  // Update UI
  totalVariableEl.textContent = fmt(totalVariable);
  totalFixedEl.textContent = fmt(totalFixed);
  summaryVariableEl.textContent = fmt(totalVariable);
  summaryFixedEl.textContent = fmt(totalFixed);
  grandTotalEl.textContent = fmt(totalVariable + totalFixed);
}

/* ===== Sync state → DOM ===== */
function syncStateToDOM() {
  daysInput.value = state.days;

  for (const [key, el] of Object.entries(variableInputs)) {
    el.value = state.variable[key];
  }
  for (const [key, el] of Object.entries(fixedInputs)) {
    el.value = state.fixed[key];
  }

  calculate();
}

/* ===== Sync DOM → state & recalculate ===== */
function syncDOMToState() {
  state.days = parseInt(daysInput.value, 10) || 1;

  for (const [key, el] of Object.entries(variableInputs)) {
    state.variable[key] = parseFloat(el.value) || 0;
  }
  for (const [key, el] of Object.entries(fixedInputs)) {
    state.fixed[key] = parseFloat(el.value) || 0;
  }

  saveState();
  calculate();
}

/* ===== Input Handlers ===== */
function handleInputChange() {
  syncDOMToState();
}

function handleDaysStep(delta) {
  const newVal = (parseInt(daysInput.value, 10) || 1) + delta;
  if (newVal >= 1 && newVal <= 365) {
    daysInput.value = newVal;
    syncDOMToState();
  }
}

/* ===== Reset ===== */
function handleReset() {
  state = clone(DEFAULT_STATE);
  syncStateToDOM();
  saveState();
}

/* ===== Init ===== */
function initApp() {
  loadState();
  syncStateToDOM();

  // Event listeners
  daysInput.addEventListener('input', handleInputChange);
  daysMinus.addEventListener('click', () => handleDaysStep(-1));
  daysPlus.addEventListener('click', () => handleDaysStep(1));

  for (const el of Object.values(variableInputs)) {
    el.addEventListener('input', handleInputChange);
  }
  for (const el of Object.values(fixedInputs)) {
    el.addEventListener('input', handleInputChange);
  }

  resetBtn.addEventListener('click', handleReset);
}

document.addEventListener('DOMContentLoaded', initApp);
