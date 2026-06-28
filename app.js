document.addEventListener('DOMContentLoaded', () => {
    const tradeForm = document.getElementById('tradeForm');
    const emptyState = document.getElementById('emptyState');
    const processingState = document.getElementById('processingState');
    const resultsView = document.getElementById('resultsView');
    
    const progressFill = document.querySelector('.progress-fill');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.spinner');

    const tickerInput = document.getElementById('ticker');
    const entryInput = document.getElementById('entryPrice');
    const stopInput = document.getElementById('stopLoss');
    const targetInput = document.getElementById('targetPrice');
    const strategyInput = document.getElementById('strategy');
    
    const rrValue = document.getElementById('rrValue');
    const lossValue = document.getElementById('lossValue');
    const sizeValue = document.getElementById('sizeValue');

    let currentTradeData = null;

    tradeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const ticker = tickerInput.value.toUpperCase();
        const entry = parseFloat(entryInput.value);
        const sl = parseFloat(stopInput.value);
        const tp = parseFloat(targetInput.value);
        const strategy = strategyInput.value;
        const mood = document.querySelector('input[name="mood"]:checked').value;

        const riskPerShare = Math.abs(entry - sl);
        const rewardPerShare = Math.abs(tp - entry);
        
        const maxRisk = 750; 
        const suggestedShares = riskPerShare > 0 ? Math.floor(maxRisk / riskPerShare) : 0;
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
                    lossValue.textContent = `-$${maxRisk}`;

                    // Dynamic Advisement Logic
                    const advisementText = document.querySelector('.advisement-text');
                    const alertDiv = document.querySelector('.alert');

                    let strategyText = strategy.replace('_', ' ');

                    advisementText.innerHTML = ''; // Clear previous content

                    const p1 = document.createTextNode('This setup aligns with a ');
                    const strong = document.createElement('strong');
                    strong.textContent = strategyText;
                    const p2 = document.createTextNode(' strategy. ');

                    advisementText.appendChild(p1);
                    advisementText.appendChild(strong);
                    advisementText.appendChild(p2);

                    const moodText = document.createTextNode(mood);

                    if (mood === 'fomo' || mood === 'anxious') {
                        const p3 = document.createTextNode("However, your psychological state registers as '");
                        const p4 = document.createTextNode("'. It is highly recommended to reduce position size or step away. ");
                        advisementText.appendChild(p3);
                        advisementText.appendChild(moodText);
                        advisementText.appendChild(p4);

                        alertDiv.className = 'alert warning';
                        alertDiv.style.backgroundColor = 'rgba(255, 42, 85, 0.1)';
                        alertDiv.style.borderColor = 'rgba(255, 42, 85, 0.2)';
                        alertDiv.style.color = 'var(--red-alert)';
                        alertDiv.innerHTML = `<span class="alert-icon">⚠️</span><strong>Caution:</strong> Sub-optimal psychology detected.`;
                    } else if (rrRatio < 2) {
                        const p3 = document.createTextNode("Your state is '");
                        const p4 = document.createTextNode(`', but the Risk/Reward ratio (${rrRatio}) is below the recommended 1:2 minimum. `);
                        advisementText.appendChild(p3);
                        advisementText.appendChild(moodText);
                        advisementText.appendChild(p4);

                        alertDiv.className = 'alert warning';
                        alertDiv.style.backgroundColor = 'rgba(255, 42, 85, 0.1)';
                        alertDiv.style.borderColor = 'rgba(255, 42, 85, 0.2)';
                        alertDiv.style.color = 'var(--red-alert)';
                        alertDiv.innerHTML = `<span class="alert-icon">⚠️</span><strong>Caution:</strong> Poor Risk/Reward ratio.`;
                    } else {
                        const p3 = document.createTextNode("Your psychological state registers as '");
                        const p4 = document.createTextNode("', which correlates with high-probability execution. ");
                        advisementText.appendChild(p3);
                        advisementText.appendChild(moodText);
                        advisementText.appendChild(p4);

                        alertDiv.className = 'alert success';
                        alertDiv.style.backgroundColor = 'rgba(163, 255, 0, 0.1)';
                        alertDiv.style.borderColor = 'rgba(163, 255, 0, 0.2)';
                        alertDiv.style.color = 'var(--lime-green)';
                        alertDiv.innerHTML = `<span class="alert-icon">✓</span><strong>Clear to execute:</strong> Setup and psychology are aligned.`;
                    }

                    currentTradeData = {
                        id: Date.now(),
                        date: new Date().toLocaleString(),
                        ticker, entry, sl, tp, strategy, mood, rrRatio, suggestedShares, maxRisk
                    };

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

    function loadJournalEntries() {
        const entriesContainer = document.getElementById('journalEntries');
        let trades;
        try {
            trades = JSON.parse(localStorage.getItem('tradeJournal') || '[]');
        } catch (e) {
            console.error('Failed to parse tradeJournal from localStorage, defaulting to empty array.', e);
            trades = [];
        }

        if (trades.length === 0) {
            entriesContainer.innerHTML = `
                <div class="empty-state">
                    <p class="text-sm text-dim">No trades logged yet.</p>
                </div>
            `;
            return;
        }

        entriesContainer.innerHTML = ''; // Clear previous contents

        trades.forEach(trade => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'journal-entry';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'journal-entry-details';

            const tickerSpan = document.createElement('span');
            tickerSpan.className = 'journal-entry-ticker';
            tickerSpan.textContent = trade.ticker + ' ';

            const strategySpan = document.createElement('span');
            strategySpan.style.fontSize = '0.8rem';
            strategySpan.style.fontWeight = 'normal';
            strategySpan.style.color = 'var(--text-dim)';
            strategySpan.textContent = `(${trade.strategy.replace('_', ' ')})`;
            tickerSpan.appendChild(strategySpan);

            const infoSpan = document.createElement('span');
            infoSpan.className = 'journal-entry-info';
            infoSpan.textContent = `${trade.date} | Entry: $${trade.entry} | SL: $${trade.sl} | TP: $${trade.tp}`;

            detailsDiv.appendChild(tickerSpan);
            detailsDiv.appendChild(infoSpan);

            const metricsDiv = document.createElement('div');
            metricsDiv.className = 'journal-entry-metrics';
            metricsDiv.style.textAlign = 'right';

            const rrDiv = document.createElement('div');
            rrDiv.style.fontWeight = 'bold';
            rrDiv.style.color = trade.rrRatio >= 2 ? 'var(--lime-green)' : 'var(--red-alert)';
            rrDiv.textContent = `R:R 1:${trade.rrRatio}`;

            const moodDiv = document.createElement('div');
            moodDiv.style.fontSize = '0.85rem';
            moodDiv.style.color = 'var(--text-dim)';
            moodDiv.textContent = `Mood: ${trade.mood}`;

            metricsDiv.appendChild(rrDiv);
            metricsDiv.appendChild(moodDiv);

            entryDiv.appendChild(detailsDiv);
            entryDiv.appendChild(metricsDiv);

            entriesContainer.appendChild(entryDiv);
        });
    }

    document.getElementById('btnLogTrade').addEventListener('click', () => {
        if (currentTradeData) {
            let trades;
            try {
                trades = JSON.parse(localStorage.getItem('tradeJournal') || '[]');
            } catch (e) {
                console.error('Failed to parse tradeJournal from localStorage, defaulting to empty array.', e);
                trades = [];
            }
            trades.unshift(currentTradeData);
            localStorage.setItem('tradeJournal', JSON.stringify(trades));

            alert(`Trade for ${currentTradeData.ticker} saved to Journal.`);

            tradeForm.reset();
            resultsView.classList.add('hidden');
            emptyState.classList.remove('hidden');
            currentTradeData = null;

            loadJournalEntries();
        }
    });

    document.getElementById('btnEditTrade').addEventListener('click', () => {
        entryInput.focus();
    });
    
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');

    // Initialize Navigation and View Switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');

            // Only switch views if the target is 'dashboard' or 'journal' for now
            if (target === 'dashboard' || target === 'journal') {
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');

                views.forEach(v => v.classList.add('hidden'));
                const targetView = document.getElementById(`${target}-view`);
                if (targetView) {
                    targetView.classList.remove('hidden');
                }

                // Update Header Text dynamically
                const headerTitle = document.querySelector('.top-header h2');
                if (target === 'dashboard') headerTitle.textContent = 'Plan & Execute';
                if (target === 'journal') headerTitle.textContent = 'Trade Journal';
            } else {
                alert(`${target.charAt(0).toUpperCase() + target.slice(1)} view is under construction.`);
            }
        });
    });

    // Initial load
    loadJournalEntries();
});