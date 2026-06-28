import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("Navigating to index.html...")
        await page.goto("http://localhost:8000")

        print("Checking for empty state...")
        await page.click('button[data-target="journal"]')
        empty_state = await page.inner_text('.empty-state p')
        print(f"Empty state text: {empty_state}")

        print("Returning to dashboard...")
        await page.click('button[data-target="dashboard"]')

        print("Filling out form...")
        await page.fill('#ticker', 'AAPL')
        await page.fill('#entryPrice', '150')
        await page.fill('#stopLoss', '145')
        await page.fill('#targetPrice', '165')
        await page.select_option('#strategy', 'breakout')
        await page.check('input[value="calm"]')

        print("Submitting form...")
        await page.click('#submitBtn')

        print("Waiting for results...")
        await page.wait_for_selector('.alert', state='visible', timeout=5000)

        alert_text = await page.inner_text('.alert')
        print(f"Alert text: {alert_text}")

        advisement_text = await page.inner_text('.advisement-text')
        print(f"Advisement text: {advisement_text}")

        print("Logging trade...")
        page.once("dialog", lambda dialog: dialog.accept()) # accept the alert
        await page.click('#btnLogTrade')

        print("Checking journal entry...")
        await page.click('button[data-target="journal"]')
        journal_entry_ticker = await page.inner_text('.journal-entry-ticker')
        print(f"Journal entry ticker: {journal_entry_ticker}")

        await browser.close()
        print("Test complete.")

asyncio.run(run())
