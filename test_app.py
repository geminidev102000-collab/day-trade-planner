import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto('http://localhost:8000')

        # Fill in the form
        await page.fill('#ticker', 'AAPL')
        await page.fill('#entryPrice', '150.00')
        await page.fill('#stopLoss', '140.00')
        await page.fill('#targetPrice', '170.00')

        # Select strategy and mood
        await page.select_option('#strategy', 'breakout')
        await page.check('input[name="mood"][value="calm"]')

        # Submit the form
        await page.click('#submitBtn')

        # Check that processing state shows up
        is_hidden = await page.evaluate("document.getElementById('processingState').classList.contains('hidden')")
        assert not is_hidden, "Processing state should not be hidden"

        # Wait for results view to show up
        await page.wait_for_selector('#resultsView:not(.hidden)', timeout=5000)

        # Verify results
        rr_value = await page.text_content('#rrValue')
        assert "1 : 2.0" in rr_value, f"Expected RR ratio '1 : 2.0' but got '{rr_value}'"

        size_value = await page.text_content('#sizeValue')
        assert "75 shares" in size_value, f"Expected size '75 shares' but got '{size_value}'"

        loss_value = await page.text_content('#lossValue')
        assert "-$750" in loss_value, f"Expected max risk '-$750' but got '{loss_value}'"

        print("All assertions passed!")
        await browser.close()

asyncio.run(run())
