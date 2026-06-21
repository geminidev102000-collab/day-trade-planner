const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;
const document = window.document;

// Simulate DOMContentLoaded manually since it seems we might need to
const script = document.createElement('script');
script.textContent = js;
document.body.appendChild(script);

// Dispatch DOMContentLoaded just in case
document.dispatchEvent(new window.Event('DOMContentLoaded'));

// Find nav items
const navItems = document.querySelectorAll('.nav-item');
const navMenu = document.querySelector('.nav-menu');

console.log("Found nav items:", navItems.length);

const iterations = 10000;

// Benchmark current (which has listeners attached to items)
const startCurrent = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
    // simulate clicking each item repeatedly
    for (let j = 0; j < navItems.length; j++) {
        navItems[j].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    }
}
const endCurrent = process.hrtime.bigint();

// Calculate time for current
const currentDuration = Number(endCurrent - startCurrent) / 1e6; // ms

// Now clear event listeners by cloning and replacing nav items
navItems.forEach(item => {
    const clone = item.cloneNode(true);
    item.replaceWith(clone);
});
// Need to re-query clones
const clonedNavItems = document.querySelectorAll('.nav-item');

// Implement new event delegation strategy
navMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (item) {
        clonedNavItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
    }
});

// Benchmark new (delegated listener)
const startNew = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
    // simulate clicking each item repeatedly
    for (let j = 0; j < clonedNavItems.length; j++) {
        clonedNavItems[j].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    }
}
const endNew = process.hrtime.bigint();

const newDuration = Number(endNew - startNew) / 1e6; // ms

console.log(`Baseline (O(N) listeners): ${currentDuration.toFixed(2)} ms`);
console.log(`Delegated (O(1) listener): ${newDuration.toFixed(2)} ms`);
console.log(`Improvement: ${(((currentDuration - newDuration) / currentDuration) * 100).toFixed(2)}%`);
