/**
 * Test Helpers and Utilities for E2E Testing
 */

export class TestHelpers {
  /**
   * Generate unique test data
   */
  static generateEmail(): string {
    return `test-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}@example.com`;
  }

  static generateName(): string {
    return `Test User ${Date.now()}`;
  }

  static generatePassword(): string {
    return `TestPass${Date.now()}!`;
  }

  static generateTodoText(): string {
    return `Test Todo ${Date.now()} - ${Math.random()
      .toString(36)
      .substring(7)}`;
  }

  /**
   * Wait helper
   */
  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Format time helper for performance measurements
   */
  static formatTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  /**
   * Get random number between min and max
   */
  static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Clean up test data - generates pattern for cleaning
   */
  static getTestDataPattern(): RegExp {
    return /^Test (Todo|User)/;
  }
}

/**
 * Custom Assertions
 */
export class CustomAssertions {
  /**
   * Assert element is visible and has text
   */
  static async assertElementHasText(
    t: TestController,
    selector: Selector,
    expectedText: string,
    message?: string
  ): Promise<void> {
    await t
      .expect(selector.exists)
      .ok(message || "Element should exist")
      .expect(selector.visible)
      .ok(message || "Element should be visible")
      .expect(selector.textContent)
      .contains(
        expectedText,
        message || `Element should contain text: ${expectedText}`
      );
  }

  /**
   * Assert element has specific attribute value
   */
  static async assertElementAttribute(
    t: TestController,
    selector: Selector,
    attribute: string,
    expectedValue: string,
    message?: string
  ): Promise<void> {
    await t
      .expect(selector.getAttribute(attribute))
      .eql(
        expectedValue,
        message || `Element should have ${attribute}="${expectedValue}"`
      );
  }

  /**
   * Assert page performance
   */
  static async assertPageLoadTime(
    t: TestController,
    maxLoadTime: number,
    message?: string
  ): Promise<void> {
    const loadTime = await t.eval(() => {
      const perfData = window.performance.timing;
      return perfData.loadEventEnd - perfData.navigationStart;
    });

    await t
      .expect(loadTime)
      .lte(maxLoadTime, message || `Page should load within ${maxLoadTime}ms`);
  }

  /**
   * Assert API response time
   */
  static async assertResponseTime(
    startTime: number,
    maxTime: number,
    t: TestController,
    message?: string
  ): Promise<void> {
    const elapsed = Date.now() - startTime;
    await t
      .expect(elapsed)
      .lte(
        maxTime,
        message ||
          `Response should complete within ${maxTime}ms, took ${elapsed}ms`
      );
  }

  /**
   * Assert element count
   */
  static async assertElementCount(
    t: TestController,
    selector: Selector,
    expectedCount: number,
    message?: string
  ): Promise<void> {
    await t
      .expect(selector.count)
      .eql(
        expectedCount,
        message || `Should have exactly ${expectedCount} elements`
      );
  }

  /**
   * Assert URL contains path
   */
  static async assertUrlContains(
    t: TestController,
    expectedPath: string,
    message?: string
  ): Promise<void> {
    const currentUrl = await t.eval(() => window.location.pathname);
    await t
      .expect(currentUrl)
      .contains(expectedPath, message || `URL should contain ${expectedPath}`);
  }
}

/**
 * Browser Detection Helper
 */
export class BrowserHelper {
  static async getBrowserInfo(t: TestController): Promise<{
    name: string;
    version: string;
    platform: string;
  }> {
    return await t.eval(() => {
      return {
        name: navigator.appName,
        version: navigator.appVersion,
        platform: navigator.platform,
      };
    });
  }

  static async getViewportSize(t: TestController): Promise<{
    width: number;
    height: number;
  }> {
    return await t.eval(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
  }
}

/**
 * Performance Measurement Helper
 */
export class PerformanceHelper {
  private static measurements: Map<string, number> = new Map();

  static start(key: string): void {
    this.measurements.set(key, Date.now());
  }

  static end(key: string): number {
    const startTime = this.measurements.get(key);
    if (!startTime) {
      throw new Error(`No start time found for key: ${key}`);
    }
    const duration = Date.now() - startTime;
    this.measurements.delete(key);
    return duration;
  }

  static async measureNavigationTiming(t: TestController): Promise<{
    domContentLoaded: number;
    loadComplete: number;
    totalTime: number;
  }> {
    return await t.eval(() => {
      const perfData = window.performance.timing;
      return {
        domContentLoaded:
          perfData.domContentLoadedEventEnd - perfData.navigationStart,
        loadComplete: perfData.loadEventEnd - perfData.navigationStart,
        totalTime: perfData.loadEventEnd - perfData.fetchStart,
      };
    });
  }

  static async measureResourceTiming(t: TestController): Promise<any[]> {
    return await t.eval(() => {
      const resources = window.performance.getEntriesByType("resource");
      return resources.map((resource: any) => ({
        name: resource.name,
        duration: resource.duration,
        size: resource.transferSize,
        type: resource.initiatorType,
      }));
    });
  }
}

/**
 * Local Storage Helper
 */
export class StorageHelper {
  static async getItem(t: TestController, key: string): Promise<string | null> {
    return await t.eval((key: string) => localStorage.getItem(key), {
      dependencies: { key },
    });
  }

  static async setItem(
    t: TestController,
    key: string,
    value: string
  ): Promise<void> {
    await t.eval(
      ({ key, value }: { key: string; value: string }) =>
        localStorage.setItem(key, value),
      {
        dependencies: { key, value },
      }
    );
  }

  static async removeItem(t: TestController, key: string): Promise<void> {
    await t.eval((key: string) => localStorage.removeItem(key), {
      dependencies: { key },
    });
  }

  static async clear(t: TestController): Promise<void> {
    await t.eval(() => localStorage.clear());
  }

  static async getAllKeys(t: TestController): Promise<string[]> {
    return await t.eval(() => Object.keys(localStorage));
  }
}

/**
 * Cookie Helper
 */
export class CookieHelper {
  static async getCookies(t: TestController): Promise<string> {
    return await t.eval(() => document.cookie);
  }

  static async getCookie(
    t: TestController,
    name: string
  ): Promise<string | null> {
    return await t.eval(
      (name: { name: string }) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
      },
      { dependencies: { name } }
    );
  }

  static async deleteCookie(t: TestController, name: string): Promise<void> {
    await t.eval(
      (name: { name: string }) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      },
      { dependencies: { name } }
    );
  }

  static async clearAllCookies(t: TestController): Promise<void> {
    await t.eval(() => {
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  }
}

/**
 * Screenshot Helper
 */
export class ScreenshotHelper {
  static async takeScreenshot(t: TestController, path: string): Promise<void> {
    await t.takeScreenshot({
      path,
      fullPage: true,
    });
  }

  static async takeElementScreenshot(
    t: TestController,
    selector: Selector,
    path: string
  ): Promise<void> {
    await t.takeElementScreenshot(selector, path);
  }
}

/**
 * Wait Conditions
 */
export class WaitConditions {
  static async waitForElement(
    t: TestController,
    selector: Selector,
    timeout: number = 5000
  ): Promise<void> {
    await t.expect(selector.exists).ok({ timeout });
  }

  static async waitForElementVisible(
    t: TestController,
    selector: Selector,
    timeout: number = 5000
  ): Promise<void> {
    await t.expect(selector.visible).ok({ timeout });
  }

  static async waitForElementCount(
    t: TestController,
    selector: Selector,
    count: number,
    timeout: number = 5000
  ): Promise<void> {
    await t.expect(selector.count).eql(count, { timeout });
  }

  static async waitForUrl(
    t: TestController,
    expectedUrl: string,
    timeout: number = 5000
  ): Promise<void> {
    let elapsed = 0;
    const interval = 100;

    while (elapsed < timeout) {
      const currentUrl = await t.eval(() => window.location.href);
      if (currentUrl.includes(expectedUrl)) {
        return;
      }
      await TestHelpers.delay(interval);
      elapsed += interval;
    }

    throw new Error(`Timeout waiting for URL to contain: ${expectedUrl}`);
  }
}

// Type augmentation for TestController
declare global {
  interface TestController {
    // This is for TypeScript awareness
  }
}

// Re-export common TestCafe types for convenience
export type { Selector } from "testcafe";
