import { fixture, test, RequestLogger, ClientFunction } from "testcafe";
import { HomePage } from "../page-objects/home.page";
import { LoginPage } from "../page-objects/login.page";
import { DashboardPage } from "../page-objects/dashboard.page";
import { TodosPage } from "../page-objects/todos.page";
import {
  TestHelpers,
  CustomAssertions,
  PerformanceHelper,
  BrowserHelper,
} from "../helpers/test-helpers";
import { guestUser, quickLogin } from "../roles/user-roles";

// Request logger for monitoring all API calls
const apiLogger = RequestLogger(/\/trpc|\/api/, {
  logRequestHeaders: true,
  logRequestBody: true,
  logResponseHeaders: true,
  logResponseBody: true,
});

// Custom client function for measuring page performance
const getPageLoadTime = ClientFunction(() => {
  const perfData = window.performance.timing;
  return {
    loadTime: perfData.loadEventEnd - perfData.navigationStart,
    domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
  };
});

fixture("Comprehensive E2E Demo - All TestCafe Capabilities")
  .page("http://localhost:3001")
  .requestHooks(apiLogger)
  .beforeEach(async (t) => {
    // Start fresh for each test
    await t.useRole(guestUser);
  });

/**
 * DEMO TEST 1: Complete User Journey
 * Demonstrates: POM, User Roles, Authentication, Navigation, API Testing
 */
test("DEMO: Complete user journey from signup to todo management", async (t) => {
  const homePage = new HomePage();
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();
  const todosPage = new TodosPage();

  // Step 1: Visit home page
  await homePage.open();
  await homePage.waitForApiReady();
  await t.takeScreenshot({ path: "demo-01-home.png" });

  // Verify API is connected
  const isConnected = await homePage.isApiConnected();
  await t.expect(isConnected).ok("API should be connected");

  // Step 2: Navigate to login and sign up
  const userData = {
    name: TestHelpers.generateName(),
    email: TestHelpers.generateEmail(),
    password: TestHelpers.generatePassword(),
  };

  await loginPage.open();
  await loginPage.signUp(userData.name, userData.email, userData.password);
  await t.takeScreenshot({ path: "demo-02-signup.png" });

  // Step 3: Verify dashboard access
  await t.wait(2000);
  await CustomAssertions.assertUrlContains(
    t,
    "/dashboard",
    "Should be on dashboard"
  );
  await t.takeScreenshot({ path: "demo-03-dashboard.png" });

  const userName = await dashboardPage.getUserName();
  await t.expect(userName).eql(userData.name, "User name should match");

  // Step 4: Create and manage todos
  await todosPage.open();

  const todo1 = "Complete TestCafe implementation";
  const todo2 = "Write comprehensive tests";
  const todo3 = "Deploy to production";

  await todosPage.addTodo(todo1);
  await todosPage.addTodo(todo2);
  await todosPage.addTodo(todo3);
  await t.takeScreenshot({ path: "demo-04-todos-added.png" });

  // Complete first todo
  await todosPage.toggleTodoByText(todo1);
  await t.takeScreenshot({ path: "demo-05-todo-completed.png" });

  // Delete second todo
  await todosPage.deleteTodoByText(todo2);
  await t.takeScreenshot({ path: "demo-06-todo-deleted.png" });

  // Verify final state
  await t
    .expect(await todosPage.todoExists(todo1))
    .ok("Todo 1 should exist")
    .expect(await todosPage.todoExists(todo2))
    .notOk("Todo 2 should be deleted")
    .expect(await todosPage.todoExists(todo3))
    .ok("Todo 3 should exist");
});

test("Should be responsive on mobile viewport (Responsive Design)", async (t) => {
  const homePage = new HomePage();

  // Test mobile viewport
  await t.resizeWindow(375, 667); // iPhone SE size
  await homePage.open();

  const viewportSize = await homePage.getViewportSize();

  // TestCafe's resizeWindow sets the outer window size, not viewport
  // The actual viewport may be smaller due to browser chrome
  // Just verify it's in a reasonable mobile range
  await t
    .expect(viewportSize.width)
    .lte(500, "Width should be mobile-sized (≤500px)")
    .expect(viewportSize.width)
    .gte(250, "Width should be at least 250px to account for browser chrome")
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

/**
 * DEMO TEST 3: Performance Measurement
 * Demonstrates: Performance helpers, timing, resource analysis
 */
test("DEMO: Comprehensive performance measurement", async (t) => {
  const homePage = new HomePage();

  // Measure page load time
  PerformanceHelper.start("fullPageLoad");
  await homePage.open();
  await homePage.waitForApiReady();
  const fullLoadTime = PerformanceHelper.end("fullPageLoad");

  await t.expect(fullLoadTime).lt(5000, "Page should load within 5 seconds");

  // Get detailed navigation timing
  const timing = await PerformanceHelper.measureNavigationTiming(t);

  // Measure resource loading
  const resources = await PerformanceHelper.measureResourceTiming(t);

  // Measure API response time
  PerformanceHelper.start("apiCall");
  await homePage.refresh();
  await homePage.waitForApiReady();
  const apiTime = PerformanceHelper.end("apiCall");

  // Get client-side performance data
  const clientPerf = await getPageLoadTime();
});

/**
 * DEMO TEST 4: Advanced Element Interactions
 * Demonstrates: Hover, focus, keyboard navigation, clicks
 */
test("DEMO: Advanced element interactions", async (t) => {
  await quickLogin(t);
  const todosPage = new TodosPage();

  await todosPage.open();

  // Test keyboard navigation
  await todosPage.focusInput();
  await t
    .typeText(todosPage.todoInput, "Test keyboard input")
    .pressKey("enter");

  await t.wait(500);
  const keyboardTodoExists = await todosPage.todoExists("Test keyboard input");
  await t.expect(keyboardTodoExists).ok();

  // Test hover interactions
  const todoText = TestHelpers.generateTodoText();
  await todosPage.addTodo(todoText);
  await todosPage.hoverOverTodo(0);

  const deleteButton = todosPage.getTodoDeleteButton(0);
  await t.expect(deleteButton.visible).ok("Delete button visible on hover");

  // Test focus management
  await t.click(todosPage.todoInput);
  await t.expect(todosPage.todoInput.focused).ok("Input should be focused");

  // Test Tab navigation
  await t
    .pressKey("tab") // Move to add button
    .pressKey("shift+tab"); // Move back to input

  // Test double-click (if applicable)
  await t.doubleClick(todosPage.todoInput);

  // Test right-click context menu
  await t.rightClick(todosPage.todoInput);
});

/**
 * DEMO TEST 5: Request Logging & API Testing
 * Demonstrates: Request hooks, API monitoring, fetch operations
 */
test("DEMO: Request logging and API testing", async (t) => {
  const homePage = new HomePage();
  const todosPage = new TodosPage();

  // Clear previous logs
  apiLogger.clear();

  // Navigate and trigger API calls
  await homePage.open();
  await homePage.waitForApiReady();

  // Verify health check was logged
  const healthCheckRequests = apiLogger.requests.filter((req) =>
    req.request.url.includes("healthCheck")
  );

  await t
    .expect(healthCheckRequests.length)
    .gt(0, "Health check request should be logged");

  // Test todos API
  await todosPage.open();
  await todosPage.waitForTodosLoad();

  const todoApiRequests = apiLogger.requests.filter((req) =>
    req.request.url.includes("todo")
  );

  // Add todo and verify API call
  apiLogger.clear();
  const todoText = TestHelpers.generateTodoText();
  await todosPage.addTodo(todoText);

  await t.wait(1000);

  const createRequests = apiLogger.requests.filter((req) =>
    req.request.url.includes("create")
  );

  await t
    .expect(createRequests.length)
    .gt(0, "Create request should be logged");
});

/**
 * DEMO TEST 6: Client-Side JavaScript Execution
 * Demonstrates: t.eval(), DOM manipulation, window object access
 */
test("DEMO: Client-side JavaScript execution", async (t) => {
  const homePage = new HomePage();

  await homePage.open();

  // Get window properties
  const windowInfo = await t.eval(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
  }));

  // Get performance metrics
  const perfMetrics = await t.eval(() => {
    const perf = window.performance;
    const timing = perf.timing;
    return {
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      connection: timing.connectEnd - timing.connectStart,
      request: timing.responseEnd - timing.requestStart,
      response: timing.responseEnd - timing.responseStart,
      dom: timing.domComplete - timing.domLoading,
    };
  });

  // Manipulate DOM
  const elementCount = await t.eval(() => {
    return {
      total: document.querySelectorAll("*").length,
      divs: document.querySelectorAll("div").length,
      buttons: document.querySelectorAll("button").length,
      links: document.querySelectorAll("a").length,
    };
  });

  // Execute custom logic
  const customData = await t.eval(() => {
    const body = document.body;
    return {
      backgroundColor: window.getComputedStyle(body).backgroundColor,
      hasScrollbar: body.scrollHeight > body.clientHeight,
      documentTitle: document.title,
    };
  });

  // Test localStorage
  await t.eval(() => {
    localStorage.setItem("testKey", "testValue");
  });

  const localStorageValue = await t.eval(() => {
    return localStorage.getItem("testKey");
  });

  await t
    .expect(localStorageValue)
    .eql("testValue", "LocalStorage should work");
});

/**
 * DEMO TEST 7: Concurrent Operations & Race Conditions
 * Demonstrates: Handling multiple simultaneous operations
 */
test("DEMO: Concurrent operations handling", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();
  await todosPage.waitForTodosLoad();

  const initialCount = await todosPage.getTodoCount();

  // Create multiple todos rapidly
  const todos = [
    TestHelpers.generateTodoText(),
    TestHelpers.generateTodoText(),
    TestHelpers.generateTodoText(),
    TestHelpers.generateTodoText(),
    TestHelpers.generateTodoText(),
  ];

  const startTime = Date.now();

  for (const todo of todos) {
    await todosPage.addTodo(todo);
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Verify all todos were added
  const finalCount = await todosPage.getTodoCount();
  await t
    .expect(finalCount)
    .eql(initialCount + todos.length, "All todos should be added");

  // Verify each todo exists
  for (const todo of todos) {
    const todoExists = await todosPage.todoExists(todo);
    await t.expect(todoExists).ok(`Todo "${todo}" should exist`);
  }
});

/**
 * DEMO TEST 8: Custom Assertions & Helpers
 * Demonstrates: Custom helper usage, advanced assertions
 */
test("DEMO: Custom assertions and helpers", async (t) => {
  const homePage = new HomePage();

  await homePage.open();

  // Use custom URL assertion
  await CustomAssertions.assertUrlContains(t, "/", "Should be on homepage");

  // Use custom element assertions
  await CustomAssertions.assertElementHasText(
    t,
    homePage.apiStatusSection,
    "API Status",
    "Section should have correct title"
  );

  // Use custom element count assertion
  await CustomAssertions.assertElementCount(
    t,
    homePage.apiStatusSection,
    1,
    "Should have one API status section"
  );

  // Test viewport size helper
  const viewport = await BrowserHelper.getViewportSize(t);

  await t.expect(viewport.width).gt(0).expect(viewport.height).gt(0);

  // Test browser info helper
  const browserInfo = await BrowserHelper.getBrowserInfo(t);
});

/**
 * DEMO TEST 9: Screenshot Showcase
 * Demonstrates: Various screenshot capabilities
 */
test("DEMO: Screenshot capabilities", async (t) => {
  const homePage = new HomePage();
  const todosPage = new TodosPage();

  // Full page screenshot
  await homePage.open();
  await t.takeScreenshot({
    path: "demo-screenshot-fullpage.png",
    fullPage: true,
  });

  // Element screenshot
  await t.takeElementScreenshot(
    homePage.apiStatusSection,
    "demo-screenshot-element.png"
  );

  // Screenshots at different viewport sizes
  await t.resizeWindow(375, 667);
  await t.takeScreenshot({
    path: "demo-screenshot-mobile.png",
    fullPage: true,
  });

  await t.resizeWindow(1920, 1080);
  await t.takeScreenshot({
    path: "demo-screenshot-desktop.png",
    fullPage: true,
  });

  // Screenshot of specific page state
  await todosPage.open();
  await todosPage.addTodo("Screenshot Test Todo");
  await t.takeScreenshot({ path: "demo-screenshot-todos-state.png" });
});

/**
 * DEMO TEST 10: Complete Feature Demonstration
 * Demonstrates: All capabilities in one comprehensive test
 */
test("DEMO: Complete TestCafe feature showcase", async (t) => {
  // 1. Page Object Model
  const homePage = new HomePage();
  const loginPage = new LoginPage();
  const todosPage = new TodosPage();

  // 2. Request Logging
  apiLogger.clear();

  // 3. Responsive Design
  await t.resizeWindow(1920, 1080);

  // 4. Navigation & Page Load Performance
  PerformanceHelper.start("navigation");
  await homePage.open();
  const navTime = PerformanceHelper.end("navigation");

  // 5. Client-Side Execution
  const pageInfo = await t.eval(() => ({
    title: document.title,
    url: window.location.href,
    readyState: document.readyState,
  }));

  // 6. Element Interactions (hover, focus)
  await t.hover(homePage.apiStatusSection);

  // 7. Screenshots
  await t.takeScreenshot({ path: "demo-final-showcase.png", fullPage: true });

  // 8. User Authentication
  const userData = {
    name: TestHelpers.generateName(),
    email: TestHelpers.generateEmail(),
    password: TestHelpers.generatePassword(),
  };

  await loginPage.open();
  await loginPage.signUp(userData.name, userData.email, userData.password);
  await t.wait(2000);

  // 9. API Testing & Request Monitoring
  await todosPage.open();
  const todoRequests = apiLogger.requests.filter((req) =>
    req.request.url.includes("todo")
  );

  // 10. Keyboard Navigation
  await t.pressKey("tab").pressKey("tab");

  // 11. Concurrent Operations
  const todos = Array.from({ length: 3 }, () => TestHelpers.generateTodoText());
  for (const todo of todos) {
    await todosPage.addTodo(todo);
  }

  // 12. Custom Assertions
  await CustomAssertions.assertUrlContains(
    t,
    "/todos",
    "Should be on todos page"
  );

  // 13. Performance Measurement
  const timing = await PerformanceHelper.measureNavigationTiming(t);
});
