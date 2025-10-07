import { fixture, test, RequestLogger } from "testcafe";
import { HomePage } from "../page-objects/home.page";
import { PerformanceHelper } from "../helpers/test-helpers";
import { guestUser } from "../roles/user-roles";

// Request logger for API monitoring
const apiLogger = RequestLogger(/\/trpc/, {
  logRequestHeaders: true,
  logRequestBody: true,
  logResponseHeaders: true,
  logResponseBody: true,
});

fixture("Home Page - E2E Tests")
  .page("http://localhost:3001")
  .requestHooks(apiLogger)
  .beforeEach(async (t) => {
    await t.useRole(guestUser);
  });

test("Should display home page with ASCII art title", async (t) => {
  const homePage = new HomePage();

  await homePage.open();

  // Verify page is loaded
  const isLoaded = await homePage.isLoaded();
  await t.expect(isLoaded).ok("Home page should be loaded");

  // Verify ASCII art title is displayed
  const titleDisplayed = await homePage.verifyTitleDisplayed();
  await t.expect(titleDisplayed).ok("ASCII art title should be displayed");

  // Take screenshot
  await t.takeScreenshot({
    path: "home-page-loaded.png",
    fullPage: true,
  });
});

test("Should show API connection status", async (t) => {
  const homePage = new HomePage();

  await homePage.open();
  await homePage.waitForApiReady();

  const apiStatus = await homePage.getApiStatus();
  await t.expect(apiStatus).contains("Connected", "API should be connected");

  const isConnected = await homePage.isApiConnected();
  await t
    .expect(isConnected)
    .ok("API connection indicator should show connected");
});

test("Should make successful API health check request", async (t) => {
  const homePage = new HomePage();

  await homePage.open();
  await homePage.waitForApiReady();

  // Verify API logger captured the health check request
  await t
    .expect(
      apiLogger.contains((record) =>
        record.request.url.includes("/trpc/healthCheck")
      )
    )
    .ok("Health check API request should be made");
});

test("Should load page within acceptable time (Performance)", async (t) => {
  PerformanceHelper.start("pageLoad");

  const homePage = new HomePage();
  await homePage.open();
  await homePage.waitForApiReady();

  const loadTime = PerformanceHelper.end("pageLoad");

  await t
    .expect(loadTime)
    .lt(5000, `Page should load within 5 seconds, took ${loadTime}ms`);

  // Measure navigation timing
  const timing = await PerformanceHelper.measureNavigationTiming(t);
  console.log("Navigation Timing:", timing);

  await t
    .expect(timing.domContentLoaded)
    .lt(3000, "DOM should load within 3 seconds")
    .expect(timing.loadComplete)
    .lt(5000, "Page should fully load within 5 seconds");
});

test("Should be responsive on mobile viewport (Responsive Design)", async (t) => {
  const homePage = new HomePage();

  // Test mobile viewport
  await t.resizeWindow(375, 667); // iPhone SE size
  await homePage.open();

  const viewportSize = await homePage.getViewportSize();
  // Allow some variance due to browser chrome
  // Account for devicePixelRatio (DPR); some environments scale CSS pixels.
  const dpr = await t.eval(() =>
    window.devicePixelRatio ? window.devicePixelRatio : 1
  );
  const expectedWidth = Math.round(375 * dpr);
  const tolerance = 100; // allow variance across platforms/browsers
  await t
    .expect(viewportSize.width)
    .within(
      expectedWidth - tolerance,
      expectedWidth + tolerance,
      `Width should be mobile-sized (expected ~${expectedWidth}px ±${tolerance}px)`
    )
    .expect(viewportSize.height)
    .gte(600, "Height should be reasonable");

  // Verify content is still visible
  await t
    .expect(homePage.titleAsciiArt.visible)
    .ok("Title should be visible on mobile");
  await t
    .expect(homePage.apiStatusSection.visible)
    .ok("API status should be visible on mobile");

  await t.takeScreenshot({
    path: "home-page-mobile.png",
    fullPage: true,
  });
});

test("Should be responsive on tablet viewport (Responsive Design)", async (t) => {
  const homePage = new HomePage();

  // Test tablet viewport
  await t.resizeWindow(768, 1024); // iPad size
  await homePage.open();

  await t
    .expect(homePage.titleAsciiArt.visible)
    .ok("Title should be visible on tablet");
  await t
    .expect(homePage.apiStatusSection.visible)
    .ok("API status should be visible on tablet");

  await t.takeScreenshot({
    path: "home-page-tablet.png",
    fullPage: true,
  });
});

test("Should be responsive on desktop viewport (Responsive Design)", async (t) => {
  const homePage = new HomePage();

  // Test desktop viewport
  await t.resizeWindow(1920, 1080);
  await homePage.open();

  await t
    .expect(homePage.titleAsciiArt.visible)
    .ok("Title should be visible on desktop");
  await t
    .expect(homePage.apiStatusSection.visible)
    .ok("API status should be visible on desktop");

  await t.takeScreenshot({
    path: "home-page-desktop.png",
    fullPage: true,
  });
});

test("Should execute client-side JavaScript correctly", async (t) => {
  const homePage = new HomePage();
  await homePage.open();

  // Execute client-side code to get window properties
  const windowWidth = await t.eval(() => window.innerWidth);
  const windowHeight = await t.eval(() => window.innerHeight);
  const userAgent = await t.eval(() => navigator.userAgent);

  await t
    .expect(windowWidth)
    .gt(0, "Window width should be greater than 0")
    .expect(windowHeight)
    .gt(0, "Window height should be greater than 0")
    .expect(userAgent)
    .ok("User agent should exist");

  // Execute custom client-side code
  const apiStatus = await t.eval(() => {
    const statusElement = document.querySelector("span");
    return statusElement ? statusElement.textContent : null;
  });

  await t.expect(apiStatus).ok("Should be able to query DOM from client-side");
});

test("Should navigate using keyboard (Keyboard Navigation)", async (t) => {
  const homePage = new HomePage();
  await homePage.open();

  // Test Tab navigation
  await t.pressKey("tab");

  // Test keyboard shortcuts
  await t.pressKey("ctrl+shift+i"); // Developer tools (won't open in headless but tests key press)

  // Verify page is still functional
  await t.expect(homePage.apiStatusSection.visible).ok();
});

test("Should handle hover interactions (Element Interactions)", async (t) => {
  const homePage = new HomePage();
  await homePage.open();

  // Hover over API status section
  await t.hover(homePage.apiStatusSection);

  // Verify element is still visible after hover
  await t.expect(homePage.apiStatusSection.visible).ok();
});

test("Should handle focus interactions (Element Interactions)", async (t) => {
  const homePage = new HomePage();
  await homePage.open();

  // Focus on body element
  await t.click(homePage.apiStatusSection);

  // Verify interaction
  await t.expect(homePage.apiStatusSection.exists).ok();
});

test("Should measure resource loading performance", async (t) => {
  const homePage = new HomePage();
  await homePage.open();
  await homePage.waitForApiReady();

  // Get resource timing data
  const resources = await PerformanceHelper.measureResourceTiming(t);

  await t.expect(resources.length).gt(0, "Should have loaded resources");

  // Log quieter output: total duration only
  const totalDuration = resources.reduce(
    (sum, r) => sum + (r.duration ?? 0),
    0
  );
  console.log(
    `Loaded ${
      resources.length
    } resources, total duration: ${totalDuration.toFixed(2)}ms`
  );
});

test("Should verify URL is correct", async (t) => {
  const homePage = new HomePage();
  await homePage.open();

  const currentUrl = await homePage.getCurrentUrl();
  await t
    .expect(currentUrl)
    .eql("http://localhost:3001/", "URL should be homepage");

  const currentPath = await homePage.getCurrentPath();
  await t.expect(currentPath).eql("/", "Path should be root");
});

test("Should verify page sections are present", async (t) => {
  const homePage = new HomePage();
  await homePage.open();

  const headings = await homePage.getSectionHeadings();
  await t.expect(headings.length).gt(0, "Should have section headings");
  await t
    .expect(headings)
    .contains("API Status", "Should have API Status section");
});

test("Should handle page refresh correctly", async (t) => {
  const homePage = new HomePage();
  await homePage.open();
  await homePage.waitForApiReady();

  // Refresh page
  await homePage.refresh();
  await t.wait(1000);

  // Verify page still works after refresh
  await homePage.waitForApiReady();
  await t
    .expect(await homePage.isLoaded())
    .ok("Page should be loaded after refresh");
});

test("Should log API requests (Request Logging)", async (t) => {
  const homePage = new HomePage();
  await homePage.open();
  await homePage.waitForApiReady();

  // Verify requests were logged
  await t
    .expect(apiLogger.requests.length)
    .gt(0, "Should have logged API requests");

  // Check specific request details
  const healthCheckRequests = apiLogger.requests.filter((req) =>
    req.request.url.includes("healthCheck")
  );

  await t
    .expect(healthCheckRequests.length)
    .gt(0, "Should have health check requests");

  if (healthCheckRequests.length > 0) {
    const firstRequest = healthCheckRequests[0];
    console.log("Health Check Request:", {
      url: firstRequest.request.url,
      method: firstRequest.request.method,
      status: firstRequest.response.statusCode,
    });
  }
});

test("Should take screenshot on test completion", async (t) => {
  const homePage = new HomePage();
  await homePage.open();
  await homePage.waitForApiReady();

  // Take final screenshot
  await t.takeScreenshot({
    path: "home-page-final.png",
    fullPage: true,
  });
});
