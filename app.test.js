const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('TradeFlow App', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        jest.useFakeTimers();

        // Clear all modules from cache to re-execute app.js
        jest.resetModules();
        require('./app.js');

        // Dispatch DOMContentLoaded to trigger event listeners inside app.js
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('calculates trade risk and suggested shares correctly', () => {
        // Find inputs
        const entryInput = document.getElementById('entryPrice');
        const stopInput = document.getElementById('stopLoss');
        const targetInput = document.getElementById('targetPrice');
        const tradeForm = document.getElementById('tradeForm');

        // Set values
        entryInput.value = '150';
        stopInput.value = '145';
        targetInput.value = '165';

        // Submit form
        tradeForm.dispatchEvent(new Event('submit', { cancelable: true }));

        // Fast-forward timers
        jest.advanceTimersByTime(5000); // Wait for processing to finish

        // Assert results
        const rrValue = document.getElementById('rrValue');
        const sizeValue = document.getElementById('sizeValue');
        const lossValue = document.getElementById('lossValue');

        // Risk per share = 150 - 145 = 5
        // Reward per share = 165 - 150 = 15
        // RR = 15 / 5 = 3
        expect(rrValue.textContent).toBe('1 : 3.0');

        // Max risk = 750
        // Suggested shares = 750 / 5 = 150
        expect(sizeValue.textContent).toBe('150 shares');
        expect(lossValue.textContent).toBe('-$750');

        // Check UI state
        expect(document.getElementById('processingState').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('resultsView').classList.contains('hidden')).toBe(false);
    });

    test('log trade button works correctly', () => {
        // Mock alert
        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

        // Setup results view to be visible
        document.getElementById('resultsView').classList.remove('hidden');
        document.getElementById('emptyState').classList.add('hidden');

        // Click log trade button
        const logBtn = document.getElementById('btnLogTrade');
        logBtn.click();

        // Assert
        expect(alertMock).toHaveBeenCalledWith('Trade logic payload saved to Data Feed/Journal safely.');
        expect(document.getElementById('resultsView').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('emptyState').classList.contains('hidden')).toBe(false);

        alertMock.mockRestore();
    });

    test('adjust parameters button focuses entry input', () => {
        const adjustBtn = document.getElementById('btnEditTrade');
        const entryInput = document.getElementById('entryPrice');

        adjustBtn.click();

        expect(document.activeElement).toBe(entryInput);
    });

    test('navigation items toggle active class', () => {
        const navItems = document.querySelectorAll('.nav-item');
        expect(navItems.length).toBeGreaterThan(1);

        const firstItem = navItems[0];
        const secondItem = navItems[1];

        secondItem.click();

        expect(firstItem.classList.contains('active')).toBe(false);
        expect(secondItem.classList.contains('active')).toBe(true);
    });
});
