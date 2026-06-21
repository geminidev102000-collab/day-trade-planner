const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('Trade Planner Logic', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        jest.useFakeTimers();
        jest.resetModules();
        require('../app.js');
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('should calculate rrRatio and suggestedShares correctly for normal input', () => {
        document.getElementById('entryPrice').value = '150';
        document.getElementById('stopLoss').value = '140';
        document.getElementById('targetPrice').value = '170';

        document.getElementById('tradeForm').dispatchEvent(new Event('submit'));

        // wait for setinterval and settimeout
        jest.runAllTimers();

        const rrValue = document.getElementById('rrValue').textContent;
        const sizeValue = document.getElementById('sizeValue').textContent;
        const lossValue = document.getElementById('lossValue').textContent;

        expect(rrValue).toBe('1 : 2.0'); // 170 - 150 = 20, 150 - 140 = 10, 20/10 = 2.0
        expect(sizeValue).toBe('75 shares'); // maxRisk 750 / 10 = 75
        expect(lossValue).toBe('-$750');
    });

    it('should handle division by zero risk (entry = stop loss)', () => {
        document.getElementById('entryPrice').value = '150';
        document.getElementById('stopLoss').value = '150'; // riskPerShare = 0
        document.getElementById('targetPrice').value = '170';

        document.getElementById('tradeForm').dispatchEvent(new Event('submit'));

        jest.runAllTimers();

        const rrValue = document.getElementById('rrValue').textContent;
        const sizeValue = document.getElementById('sizeValue').textContent;
        const lossValue = document.getElementById('lossValue').textContent;

        // The JS handles it by setting suggestedShares to 0 and rrRatio to 0
        // suggestedShares = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0;
        // let rrRatio = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(1) : 0;
        expect(rrValue).toBe('1 : 0');
        expect(sizeValue).toBe('0 shares');
        expect(lossValue).toBe('-$750');
    });
});
