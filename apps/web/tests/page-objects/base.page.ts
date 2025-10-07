import { Selector, t } from "testcafe";

/**
 * Base Page Object - Contains common functionality for all pages
 */
export class BasePage {
  protected baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3001") {
    this.baseUrl = baseUrl;
  }

  /**
   * Navigate to a specific path
   */
  async navigate(path: string = ""): Promise<void> {
    await t.navigateTo(`${this.baseUrl}${path}`);
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string> {
    return await t.eval(() => window.location.href);
  }

  /**
   * Get current pathname
   */
  async getCurrentPath(): Promise<string> {
    return await t.eval(() => window.location.pathname);
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad(): Promise<void> {
    await t.expect(Selector("body").exists).ok({ timeout: 10000 });
  }

  /**
   * Refresh the page
   */
  async refresh(): Promise<void> {
    await t.eval(() => location.reload());
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await t.eval(() => window.history.back());
  }

  /**
   * Execute client-side JavaScript
   */
  async executeScript<T>(script: () => T): Promise<T> {
    return await t.eval(script);
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: Selector): Promise<boolean> {
    return await selector.exists;
  }

  /**
   * Check if element is visible
   */
  async elementVisible(selector: Selector): Promise<boolean> {
    return await selector.visible;
  }

  /**
   * Get element text
   */
  async getElementText(selector: Selector): Promise<string> {
    return await selector.innerText;
  }

  /**
   * Get element attribute
   */
  async getElementAttribute(
    selector: Selector,
    attribute: string
  ): Promise<string | null> {
    return await selector.getAttribute(attribute);
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(
    selector: Selector,
    timeout: number = 5000
  ): Promise<void> {
    await t.expect(selector.exists).ok({ timeout });
  }

  /**
   * Wait for element to be visible
   */
  async waitForElementVisible(
    selector: Selector,
    timeout: number = 5000
  ): Promise<void> {
    await t.expect(selector.visible).ok({ timeout });
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(path?: string): Promise<void> {
    if (path) {
      await t.takeScreenshot({ path, fullPage: true });
    } else {
      await t.takeScreenshot({ fullPage: true });
    }
  }

  /**
   * Hover over element
   */
  async hoverElement(selector: Selector): Promise<void> {
    await t.hover(selector);
  }

  /**
   * Focus on element
   */
  async focusElement(selector: Selector): Promise<void> {
    await t.click(selector);
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: Selector): Promise<void> {
    await t.scrollIntoView(selector);
  }

  /**
   * Get viewport size
   */
  async getViewportSize(): Promise<{ width: number; height: number }> {
    return await t.eval(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
  }

  /**
   * Resize viewport
   */
  async resizeWindow(width: number, height: number): Promise<void> {
    await t.resizeWindow(width, height);
  }

  /**
   * Check if page contains text
   */
  async pageContainsText(text: string): Promise<boolean> {
    const bodyText = await Selector("body").innerText;
    return bodyText.includes(text);
  }

  /**
   * Get page title
   */
  async getPageTitle(): Promise<string> {
    return await t.eval(() => document.title);
  }

  /**
   * Wait for API response (using fetch interception)
   */
  async waitForApiResponse(timeout: number = 5000): Promise<void> {
    let elapsed = 0;
    const interval = 100;

    while (elapsed < timeout) {
      await t.wait(interval);
      elapsed += interval;
      // In real scenario, you'd check network activity
      // This is a simplified version
    }
  }

  /**
   * Get console logs
   */
  async getConsoleLogs(): Promise<any[]> {
    // Note: TestCafe has request hooks for this
    return [];
  }

  /**
   * Check element has CSS class
   */
  async elementHasClass(
    selector: Selector,
    className: string
  ): Promise<boolean> {
    const classes = await selector.getAttribute("class");
    return classes ? classes.split(" ").includes(className) : false;
  }

  /**
   * Press keyboard key
   */
  async pressKey(key: string): Promise<void> {
    await t.pressKey(key);
  }

  /**
   * Type text slowly (simulating real typing)
   */
  async typeSlowly(
    selector: Selector,
    text: string,
    delay: number = 100
  ): Promise<void> {
    await t.click(selector);
    for (const char of text) {
      await t.typeText(selector, char, { replace: false });
      await t.wait(delay);
    }
  }

  /**
   * Double click element
   */
  async doubleClick(selector: Selector): Promise<void> {
    await t.doubleClick(selector);
  }

  /**
   * Right click element
   */
  async rightClick(selector: Selector): Promise<void> {
    await t.rightClick(selector);
  }

  /**
   * Drag and drop
   */
  async dragToElement(source: Selector, destination: Selector): Promise<void> {
    await t.drag(source, 0, 0, {
      offsetX: await destination.offsetLeft,
      offsetY: await destination.offsetTop,
    });
  }

  /**
   * Select option from dropdown
   */
  async selectOption(selector: Selector, value: string): Promise<void> {
    await t.click(selector).click(Selector("option").withText(value));
  }

  /**
   * Get all options from dropdown
   */
  async getSelectOptions(selector: Selector): Promise<string[]> {
    const options = selector.find("option");
    const count = await options.count;
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent;
      values.push(text);
    }

    return values;
  }

  /**
   * Switch to iframe
   */
  async switchToIframe(selector: Selector): Promise<void> {
    await t.switchToIframe(selector);
  }

  /**
   * Switch to main frame
   */
  async switchToMainFrame(): Promise<void> {
    await t.switchToMainWindow();
  }

  /**
   * Get element count
   */
  async getElementCount(selector: Selector): Promise<number> {
    return await selector.count;
  }

  /**
   * Check if checkbox is checked
   */
  async isChecked(selector: Selector): Promise<boolean> {
    const checked = await selector.checked;
    return checked ?? false;
  }

  /**
   * Get input value
   */
  async getInputValue(selector: Selector): Promise<string> {
    const value = await selector.value;
    return value ?? "";
  }
}
