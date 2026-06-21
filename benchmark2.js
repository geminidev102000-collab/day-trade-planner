const { JSDOM } = require('jsdom');

const iterations = 1000; // reduced iterations

function benchBaseline() {
    const dom = new JSDOM(`<body><nav class="nav-menu"></nav></body>`);
    const document = dom.window.document;
    const navMenu = document.querySelector('.nav-menu');

    // create 100 items
    for (let i = 0; i < 100; i++) {
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        navMenu.appendChild(btn);
    }

    const start = process.hrtime.bigint();
    for (let iter = 0; iter < iterations; iter++) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
    return Number(process.hrtime.bigint() - start) / 1e6;
}

function benchDelegation() {
    const dom = new JSDOM(`<body><nav class="nav-menu"></nav></body>`);
    const document = dom.window.document;
    const navMenu = document.querySelector('.nav-menu');

    // create 100 items
    for (let i = 0; i < 100; i++) {
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        navMenu.appendChild(btn);
    }

    const start = process.hrtime.bigint();
    for (let iter = 0; iter < iterations; iter++) {
        // Event delegation: attach to parent
        navMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.nav-item');
            if (item) {
                const navItems = document.querySelectorAll('.nav-item');
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
            }
        });
    }
    return Number(process.hrtime.bigint() - start) / 1e6;
}

const baselineTime = benchBaseline();
const delegationTime = benchDelegation();

console.log(`Baseline (O(N) listeners): ${baselineTime.toFixed(2)} ms`);
console.log(`Delegated (O(1) listener): ${delegationTime.toFixed(2)} ms`);
console.log(`Improvement: ${(((baselineTime - delegationTime) / baselineTime) * 100).toFixed(2)}%`);
