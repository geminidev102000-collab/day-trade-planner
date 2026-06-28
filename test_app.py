from playwright.sync_api import sync_playwright
import time

def test_app():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Handle JS dialogs (like the alert when logging a trade)
        page.on("dialog", lambda dialog: dialog.accept())

        page.goto("http://localhost:3000")

        # Test clicking analyze trade to check the output
        page.fill('#ticker', 'AAPL')
        page.fill('#entryPrice', '150')
        page.fill('#stopLoss', '140')
        page.fill('#targetPrice', '200')
        page.click('#submitBtn')

        # Wait for results to be shown
        page.wait_for_selector('#resultsView:not(.hidden)')

        # Check text in the alert box
        alert_text = page.locator('.alert').inner_text()
        print(f"Alert Text: {alert_text}")

        # Test saving the trade
        page.click('#btnLogTrade')

        # Click the journal nav link to switch view
        page.click('[data-target="journal"]')

        # Wait for journal view to be visible
        page.wait_for_selector('#journal-view:not(.hidden)')

        journal_text = page.locator('#journalEntries').inner_text()
        print(f"Journal Text: {journal_text}")

        browser.close()

if __name__ == '__main__':
    test_app()
