const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

// Using separate files ensures JSDOM is entirely refreshed, removing event listeners on document
// But we can just use one test file and focus on the issue
describe('localStorage JSON.parse error handling', () => {
  let originalConsoleError;

  beforeEach(() => {
    document.documentElement.innerHTML = html.toString();
    window.alert = jest.fn();
    originalConsoleError = console.error;
    console.error = jest.fn();
    localStorage.clear();
    localStorage.setItem('tradeJournal', '{invalid_json');
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('loadJournalEntries gracefully handles invalid JSON in localStorage', () => {
    jest.resetModules();
    require('./app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    expect(console.error).toHaveBeenCalledWith(
        'Failed to parse tradeJournal from localStorage, defaulting to empty array.',
        expect.any(SyntaxError)
    );

    const entriesContainer = document.getElementById('journalEntries');
    expect(entriesContainer.innerHTML).toContain('No trades logged yet.');
  });
});
