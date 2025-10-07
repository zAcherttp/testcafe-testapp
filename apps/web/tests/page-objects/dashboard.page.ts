import { Selector, t } from "testcafe";
import { BasePage } from "./base.page";

/**
 * Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  // Selectors
  readonly pageTitle = Selector("h1").withText("Dashboard");
  readonly welcomeMessage = Selector("p").withText(/Welcome/);
  readonly apiMessage = Selector("p").withText(/API:/);
  readonly userNameText = Selector("p").withText(/Welcome/);

  /**
   * Navigate to dashboard
   */
  async open(): Promise<void> {
    await this.navigate("/dashboard");
    await this.waitForPageLoad();
  }

  /**
   * Check if dashboard is loaded
   */
  async isLoaded(): Promise<boolean> {
    // Wait for rendering
    await t.wait(1000);
    return await this.pageTitle.exists;
  }

  /**
   * Get welcome message
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.welcomeMessage.innerText;
  }

  /**
   * Get user name from welcome message
   */
  async getUserName(): Promise<string | null> {
    const message = await this.getWelcomeMessage();
    const match = message.match(/Welcome (.+)/);
    return match ? match[1] : null;
  }

  /**
   * Get API message
   */
  async getApiMessage(): Promise<string> {
    return await this.apiMessage.innerText;
  }

  /**
   * Verify user is logged in
   */
  async verifyUserLoggedIn(expectedName?: string): Promise<boolean> {
    const isLoaded = await this.isLoaded();

    if (!isLoaded) {
      return false;
    }

    if (expectedName) {
      const userName = await this.getUserName();
      return userName === expectedName;
    }

    return true;
  }

  /**
   * Verify private data is loaded
   */
  async verifyPrivateDataLoaded(): Promise<boolean> {
    const message = await this.getApiMessage();
    return message.length > 4; // More than just "API:"
  }

  /**
   * Wait for dashboard data to load
   */
  async waitForDataLoad(timeout: number = 5000): Promise<void> {
    await this.waitForElement(this.apiMessage, timeout);
  }
}
