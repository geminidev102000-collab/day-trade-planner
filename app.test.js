/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

// Capture the DOMContentLoaded callback so we can execute it fresh for each test
let domContentLoadedCallback = null;
const originalAddEventListener = document.addEventListener;
document.addEventListener = jest.fn((event, cb) => {
    if (event === 'DOMContentLoaded') {
        domContentLoadedCallback = cb;
    } else {
        originalAddEventListener.call(document, event, cb);
    }
});

// Require the app file once. It will attach the event listener.
require('./app.js');

describe('TradeFlow App', () => {
    beforeEach(() => {
        // Reset DOM
        document.documentElement.innerHTML = html.toString();

        // Mock localStorage
        const localStorageMock = (() => {
            let store = {};
            return {
                getItem: jest.fn(key => store[key] || null),
                setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
                clear: jest.fn(() => { store = {}; }),
                removeItem: jest.fn(key => { delete store[key]; })
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Use fake timers for intervals and timeouts
        jest.useFakeTimers();

        // Run the initialization logic with the fresh DOM
        if (domContentLoadedCallback) {
            domContentLoadedCallback();
        }
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        window.localStorage.clear();
        jest.clearAllMocks();
    });

    test('initializes correctly and loads empty journal', () => {
        const journalEntries = document.getElementById('journalEntries');
        expect(journalEntries.innerHTML).toContain('No trades logged yet.');

        const dashboardView = document.getElementById('dashboard-view');
        expect(dashboardView.classList.contains('hidden')).toBe(false);

        const journalView = document.getElementById('journal-view');
        expect(journalView.classList.contains('hidden')).toBe(true);
    });

    test('submits trade form successfully (happy path)', () => {
        document.getElementById('ticker').value = 'AAPL';
        document.getElementById('entryPrice').value = '150';
        document.getElementById('stopLoss').value = '145';
        document.getElementById('targetPrice').value = '165'; // RR = 15 / 5 = 3
        document.getElementById('strategy').value = 'breakout';
        document.querySelector('input[name="mood"][value="calm"]').checked = true;

        const tradeForm = document.getElementById('tradeForm');
        tradeForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

        // Progress bar should start, processing state should show
        expect(document.getElementById('processingState').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('emptyState').classList.contains('hidden')).toBe(true);

        // Fast forward timers for interval and timeout
        jest.runAllTimers(); // More than enough time to clear interval and hit timeout

        // Results view should be visible
        expect(document.getElementById('processingState').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('resultsView').classList.contains('hidden')).toBe(false);

        // Verify risk reward calculation
        const rrValue = document.getElementById('rrValue');
        expect(rrValue.textContent).toBe('1 : 3.0');
        expect(rrValue.className).toContain('excellent');

        // Verify advisable message
        const advisementText = document.querySelector('.advisement-text');
        expect(advisementText.textContent).toContain('calm');
        expect(advisementText.textContent).toContain('correlates with high-probability execution');
    });

    test('shows warnings for poor RR and fomo mood', () => {
        document.getElementById('ticker').value = 'BTCUSD';
        document.getElementById('entryPrice').value = '100';
        document.getElementById('stopLoss').value = '90';
        document.getElementById('targetPrice').value = '110'; // RR = 10 / 10 = 1
        document.getElementById('strategy').value = 'trend_following';
        document.querySelector('input[name="mood"][value="fomo"]').checked = true;

        const tradeForm = document.getElementById('tradeForm');
        tradeForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

        jest.runAllTimers();

        const rrValue = document.getElementById('rrValue');
        expect(rrValue.textContent).toBe('1 : 1.0');
        expect(rrValue.className).toContain('warning');

        // FOMO check takes precedence
        const alertDiv = document.querySelector('.alert');
        expect(alertDiv.className).toContain('warning');
        expect(alertDiv.textContent).toContain('Sub-optimal psychology detected');
    });

    test('shows warning for calm mood but poor RR', () => {
        document.getElementById('ticker').value = 'BTCUSD';
        document.getElementById('entryPrice').value = '100';
        document.getElementById('stopLoss').value = '90';
        document.getElementById('targetPrice').value = '110'; // RR = 10 / 10 = 1
        document.getElementById('strategy').value = 'trend_following';
        document.querySelector('input[name="mood"][value="calm"]').checked = true;

        const tradeForm = document.getElementById('tradeForm');
        tradeForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

        jest.runAllTimers();

        const rrValue = document.getElementById('rrValue');
        expect(rrValue.textContent).toBe('1 : 1.0');
        expect(rrValue.className).toContain('warning');

        // Poor RR check
        const alertDiv = document.querySelector('.alert');
        expect(alertDiv.className).toContain('warning');
        expect(alertDiv.textContent).toContain('Poor Risk/Reward ratio');
    });

    test('logs trade to journal', () => {
        window.alert = jest.fn();

        // Submit a trade first
        document.getElementById('ticker').value = 'TSLA';
        document.getElementById('entryPrice').value = '200';
        document.getElementById('stopLoss').value = '190';
        document.getElementById('targetPrice').value = '220';
        document.getElementById('strategy').value = 'mean_reversion';
        document.querySelector('input[name="mood"][value="calm"]').checked = true;

        document.getElementById('tradeForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        jest.runAllTimers();

        // Click Log to Journal
        document.getElementById('btnLogTrade').dispatchEvent(new Event('click'));

        // Check alert was called
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('TSLA saved to Journal.'));

        // Check if journal entry is created in DOM
        const journalEntries = document.getElementById('journalEntries');
        expect(journalEntries.innerHTML).toContain('TSLA');
        expect(journalEntries.innerHTML).toContain('mean reversion');

        // Check localStorage
        const stored = JSON.parse(window.localStorage.getItem('tradeJournal'));
        expect(stored.length).toBe(1);
        expect(stored[0].ticker).toBe('TSLA');
    });

    test('navigates between views', () => {
        window.alert = jest.fn();
        const navItems = document.querySelectorAll('.nav-item');

        // Find journal nav item
        const journalNav = Array.from(navItems).find(item => item.getAttribute('data-target') === 'journal');
        journalNav.dispatchEvent(new Event('click'));

        expect(document.getElementById('dashboard-view').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('journal-view').classList.contains('hidden')).toBe(false);
        expect(document.querySelector('.top-header h2').textContent).toBe('Trade Journal');

        // Nav to undefined view
        const watchlistNav = Array.from(navItems).find(item => item.getAttribute('data-target') === 'watchlist');
        watchlistNav.dispatchEvent(new Event('click'));
        expect(window.alert).toHaveBeenCalledWith('Watchlist view is under construction.');
    });
});
