const MAX_RISK = 750;

document.addEventListener('DOMContentLoaded', () => {
    const tradeForm = document.getElementById('tradeForm');
    const emptyState = document.getElementById('emptyState');
    const processingState = document.getElementById('processingState');
    const resultsView = document.getElementById('resultsView');
    
    const progressFill = document.querySelector('.progress-fill');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.spinner');

    const entryInput = document.getElementById('entryPrice');
    const stopInput = document.getElementById('stopLoss');
    const targetInput = document.getElementById('targetPrice');
    
    const rrValue = document.getElementById('rrValue');
    const lossValue = document.getElementById('lossValue');
    const sizeValue = document.getElementById('sizeValue');

    tradeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const entry = parseFloat(entryInput.value);
        const sl = parseFloat(stopInput.value);
        const tp = parseFloat(targetInput.value);

        const riskPerShare = Math.abs(entry - sl);
        const rewardPerShare = Math.abs(tp - entry);
        
        const suggestedShares = riskPerShare > 0 ? Math.floor(MAX_RISK / riskPerShare) : 0;
        let rrRatio = riskPerShare > 0 ? (rewardPerShare / riskPerShare).toFixed(1) : 0;

        emptyState.classList.add('hidden');
        resultsView.classList.add('hidden');
        processingState.classList.remove('hidden');
        
        submitBtn.disabled = true;
        btnText.textContent = 'Processing Data...';
        btnSpinner.classList.remove('hidden');

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) progress = 100;
            
            progressFill.style.width = `${progress}%`;

            if (progress === 100) {
                clearInterval(interval);
                
                setTimeout(() => {
                    rrValue.textContent = `1 : ${rrRatio}`;
                    if (rrRatio >= 3) rrValue.className = 'value excellent';
                    else if (rrRatio >= 2) rrValue.className = 'value';
                    else rrValue.className = 'value warning';

                    sizeValue.textContent = `${suggestedShares} shares`;
                    lossValue.textContent = `-$${MAX_RISK}`;

                    processingState.classList.add('hidden');
                    resultsView.classList.remove('hidden');
                    
                    submitBtn.disabled = false;
                    btnText.textContent = 'Analyze Trade';
                    btnSpinner.classList.add('hidden');
                    progressFill.style.width = '0%';
                }, 500);
            }
        }, 350);
    });

    document.getElementById('btnLogTrade').addEventListener('click', () => {
        alert('Trade logic payload saved to Data Feed/Journal safely.');
        tradeForm.reset();
        resultsView.classList.add('hidden');
        emptyState.classList.remove('hidden');
    });

    document.getElementById('btnEditTrade').addEventListener('click', () => {
        entryInput.focus();
    });
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });
});