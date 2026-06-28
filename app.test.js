/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

describe('Trade Form Inputs Edge Cases', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();

        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => null),
                setItem: jest.fn(() => null)
            },
            writable: true
        });

        jest.resetModules();
        require('./app.js');
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    test('should handle completely empty string inputs (evaluates to NaN in parseFloat)', () => {
        const form = document.getElementById('tradeForm');

        document.getElementById('ticker').value = 'AAPL';
        // Need to explicitly trigger validation bypass since html inputs have "required" attribute
        // And we're forcing empty strings or invalid strings
        document.getElementById('entryPrice').removeAttribute('required');
        document.getElementById('stopLoss').removeAttribute('required');
        document.getElementById('targetPrice').removeAttribute('required');

        document.getElementById('entryPrice').value = '';
        document.getElementById('stopLoss').value = '';
        document.getElementById('targetPrice').value = '';
        document.getElementById('strategy').value = 'breakout';

        jest.useFakeTimers();
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        jest.advanceTimersByTime(5000);

        expect(document.getElementById('sizeValue').textContent).toBe('0 shares');
        expect(document.getElementById('rrValue').textContent).toBe('1 : 0');
        expect(document.getElementById('lossValue').textContent).toBe('-$750');

        jest.useRealTimers();
    });

    test('should handle non-numeric text inputs (evaluates to NaN in parseFloat)', () => {
        const form = document.getElementById('tradeForm');

        document.getElementById('ticker').value = 'TSLA';

        // Remove 'type="number"' so we can input invalid strings
        document.getElementById('entryPrice').type = 'text';
        document.getElementById('stopLoss').type = 'text';
        document.getElementById('targetPrice').type = 'text';

        document.getElementById('entryPrice').value = 'invalid';
        document.getElementById('stopLoss').value = 'not-a-number';
        document.getElementById('targetPrice').value = 'text';
        document.getElementById('strategy').value = 'breakout';

        jest.useFakeTimers();
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        jest.advanceTimersByTime(5000);

        expect(document.getElementById('sizeValue').textContent).toBe('0 shares');
        expect(document.getElementById('rrValue').textContent).toBe('1 : 0');
        expect(document.getElementById('lossValue').textContent).toBe('-$750');

        jest.useRealTimers();
    });

    test('should handle extreme values correctly without breaking (Infinity)', () => {
        const form = document.getElementById('tradeForm');

        document.getElementById('ticker').value = 'GME';

        document.getElementById('entryPrice').type = 'text';
        document.getElementById('stopLoss').type = 'text';
        document.getElementById('targetPrice').type = 'text';

        document.getElementById('entryPrice').value = '1e308'; // Valid float, approaching Infinity
        document.getElementById('stopLoss').value = '0';
        document.getElementById('targetPrice').value = '1e309'; // Valid float, essentially Infinity
        document.getElementById('strategy').value = 'breakout';

        jest.useFakeTimers();
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        jest.advanceTimersByTime(5000);

        const suggestedShares = document.getElementById('sizeValue').textContent;
        expect(suggestedShares).toBe('0 shares');

        jest.useRealTimers();
    });
});
