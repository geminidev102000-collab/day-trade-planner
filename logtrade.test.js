const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('localStorage JSON.parse error handling - logTrade', () => {
  let originalConsoleError;

  beforeEach(() => {
    document.documentElement.innerHTML = html.toString();
    window.alert = jest.fn();
    originalConsoleError = console.error;
    console.error = jest.fn();
    localStorage.clear();
    localStorage.setItem('tradeJournal', '{invalid_json');
    jest.resetModules();
    require('./app.js');
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('logging a new trade gracefully handles invalid JSON in localStorage', () => {
    document.dispatchEvent(new Event('DOMContentLoaded'));

    document.getElementById('ticker').value = 'AAPL';
    document.getElementById('entryPrice').value = '150';
    document.getElementById('stopLoss').value = '145';
    document.getElementById('targetPrice').value = '165';

    const tradeForm = document.getElementById('tradeForm');

    jest.useFakeTimers();
    tradeForm.dispatchEvent(new Event('submit', { cancelable: true }));

    jest.advanceTimersByTime(20000);

    const logBtn = document.getElementById('btnLogTrade');
    logBtn.dispatchEvent(new Event('click'));

    expect(console.error).toHaveBeenCalledWith(
        'Failed to parse tradeJournal from localStorage, defaulting to empty array.',
        expect.any(SyntaxError)
    );

    const saved = JSON.parse(localStorage.getItem('tradeJournal'));
    expect(saved).toHaveLength(1);
    expect(saved[0].ticker).toBe('AAPL');

    jest.useRealTimers();
  });
});
