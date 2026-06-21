const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('Trade Form Submission Flow', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        jest.resetModules();
        require('./app.js');
        // Manually trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('should process trade form submission correctly', () => {
        const tradeForm = document.getElementById('tradeForm');
        const entryInput = document.getElementById('entryPrice');
        const stopInput = document.getElementById('stopLoss');
        const targetInput = document.getElementById('targetPrice');
        const emptyState = document.getElementById('emptyState');
        const processingState = document.getElementById('processingState');
        const resultsView = document.getElementById('resultsView');
        const submitBtn = document.getElementById('submitBtn');
        const progressFill = document.querySelector('.progress-fill');
        const rrValue = document.getElementById('rrValue');
        const lossValue = document.getElementById('lossValue');
        const sizeValue = document.getElementById('sizeValue');

        // Set form values
        entryInput.value = '150.00';
        stopInput.value = '145.00';
        targetInput.value = '165.00';

        // Mock Math.random to make progress bar predictable
        const originalRandom = Math.random;
        Math.random = jest.fn(() => 1); // Math.random() * 20 = 20

        // Submit the form
        tradeForm.dispatchEvent(new Event('submit', { cancelable: true }));

        // Initial UI state checks
        expect(emptyState.classList.contains('hidden')).toBe(true);
        expect(resultsView.classList.contains('hidden')).toBe(true);
        expect(processingState.classList.contains('hidden')).toBe(false);
        expect(submitBtn.disabled).toBe(true);

        // Advance timers by 350ms 5 times to reach progress = 100
        // Progress increases by 20 each interval, so 5 intervals = 100
        for (let i = 0; i < 5; i++) {
            jest.advanceTimersByTime(350);
        }

        expect(progressFill.style.width).toBe('100%');

        // Advance timers for the 500ms setTimeout
        jest.advanceTimersByTime(500);

        // Verify final UI state
        // Risk = 150 - 145 = 5
        // Reward = 165 - 150 = 15
        // RR = 15 / 5 = 3.0
        // maxRisk = 750
        // Shares = 750 / 5 = 150
        expect(rrValue.textContent).toBe('1 : 3.0');
        expect(rrValue.className).toBe('value excellent');
        expect(sizeValue.textContent).toBe('150 shares');
        expect(lossValue.textContent).toBe('-$750');

        expect(processingState.classList.contains('hidden')).toBe(true);
        expect(resultsView.classList.contains('hidden')).toBe(false);
        expect(submitBtn.disabled).toBe(false);
        expect(progressFill.style.width).toBe('0%');

        // Restore Math.random
        Math.random = originalRandom;
    });
});
