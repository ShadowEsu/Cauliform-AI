from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 390, 'height': 844}) # iPhone 12 Pro size
        try:
            # Landing Page
            page.goto("http://localhost:3000")
            page.wait_for_selector("text=Cauliform")
            page.screenshot(path="verification/landing_mobile.png")

            # Login Page
            page.goto("http://localhost:3000/login")
            page.wait_for_selector("text=Welcome back")
            page.screenshot(path="verification/login_mobile.png")

            # Signup Page
            page.goto("http://localhost:3000/signup")
            page.wait_for_selector("text=Create your account")
            page.screenshot(path="verification/signup_mobile.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
