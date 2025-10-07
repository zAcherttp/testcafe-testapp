import { Selector, t } from "testcafe";
import { BasePage } from "./base.page";

/**
 * Home Page Object
 */
export class HomePage extends BasePage {
  // Selectors
  readonly titleAsciiArt = Selector("pre.overflow-x-auto");
  readonly apiStatusSection = Selector("section").withText("API Status");
  readonly apiStatusIndicator = this.apiStatusSection
    .find("div")
    .withAttribute("class", /bg-(green|red)-500/);
  readonly apiStatusText = this.apiStatusSection.find("span");

  /**
   * Navigate to home page
   */
  async open(): Promise<void> {
    await this.navigate("/");
    await this.waitForPageLoad();
  }

  /**
   * Check if page is loaded correctly
   */
  async isLoaded(): Promise<boolean> {
    return (
      (await this.titleAsciiArt.exists) && (await this.apiStatusSection.exists)
    );
  }

  /**
   * Get API status
   */
  async getApiStatus(): Promise<string> {
    return await this.apiStatusText.innerText;
  }

  /**
   * Check if API is connected
   */
  async isApiConnected(): Promise<boolean> {
    const status = await this.getApiStatus();
    return status.includes("Connected");
  }

  /**
   * Wait for API to be ready
   */
  async waitForApiReady(timeout: number = 10000): Promise<void> {
    await this.waitForElement(this.apiStatusIndicator, timeout);

    // Wait at least 1 second for API to connect
    await t.wait(1000);

    const statusText = await this.getApiStatus();

    if (!statusText.includes("Connected")) {
      throw new Error("API is not connected");
    }
  }

  /**
   * Verify ASCII art title is displayed
   */
  async verifyTitleDisplayed(): Promise<boolean> {
    const exists = await this.titleAsciiArt.exists;
    if (!exists) return false;

    const text = await this.titleAsciiArt.innerText;
    // Check if it has content (ASCII art)
    return text.length > 50;
  }

  /**
   * Get all section headings
   */
  async getSectionHeadings(): Promise<string[]> {
    const headings = Selector("h2");
    const count = await headings.count;
    const titles: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await headings.nth(i).innerText;
      titles.push(text);
    }

    return titles;
  }
}
