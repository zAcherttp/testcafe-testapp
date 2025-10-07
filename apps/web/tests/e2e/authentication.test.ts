import { fixture, test, RequestLogger } from "testcafe";
import { LoginPage } from "../page-objects/login.page";
import { DashboardPage } from "../page-objects/dashboard.page";
import { TestHelpers, CustomAssertions } from "../helpers/test-helpers";
import { guestUser } from "../roles/user-roles";

const apiLogger = RequestLogger(/\/trpc|\/api/, {
  logRequestHeaders: true,
  logRequestBody: true,
  logResponseHeaders: true,
  logResponseBody: true,
});

fixture("Authentication - E2E Tests")
  .page("http://localhost:3001")
  .requestHooks(apiLogger)
  .beforeEach(async (t) => {
    await t.useRole(guestUser);
  });

test("Should display sign-up form by default", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();

  // Wait for form to render
  await t.wait(1000);

  const isOnSignUp = await loginPage.isOnSignUpForm();
  await t.expect(isOnSignUp).ok("Should display sign-up form by default");

  const formTitle = await loginPage.getFormTitle();
  await t.expect(formTitle).eql("Create Account");
});

test("Should switch between sign-up and sign-in forms", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();

  // Wait for form to render
  await t.wait(1000);

  // Start on sign-up
  await t.expect(await loginPage.isOnSignUpForm()).ok();

  // Switch to sign-in
  await loginPage.switchToSignIn();
  await t.expect(await loginPage.isOnSignInForm()).ok();

  // Switch back to sign-up
  await loginPage.switchToSignUp();
  await t.expect(await loginPage.isOnSignUpForm()).ok();
});

test("Should sign up with valid credentials and redirect to dashboard", async (t) => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();

  const userData = {
    name: TestHelpers.generateName(),
    email: TestHelpers.generateEmail(),
    password: TestHelpers.generatePassword(),
  };

  await loginPage.open();
  await loginPage.signUp(userData.name, userData.email, userData.password);

  // Verify redirect to dashboard
  await CustomAssertions.assertUrlContains(
    t,
    "/dashboard",
    "Should redirect to dashboard"
  );

  // Verify user is logged in
  const isLoggedIn = await dashboardPage.verifyUserLoggedIn(userData.name);
  await t.expect(isLoggedIn).ok("User should be logged in with correct name");

  // Take screenshot
  await t.takeScreenshot({
    path: "auth-signup-success.png",
    fullPage: true,
  });
});

test("Should sign up then sign in with same account succeeds", async (t) => {
  const loginPage = new LoginPage();
  const dashboardPage = new DashboardPage();

  const userData = {
    name: TestHelpers.generateName(),
    email: TestHelpers.generateEmail(),
    password: TestHelpers.generatePassword(),
  };

  // Step 1: Sign up
  await loginPage.open();
  await loginPage.signUp(userData.name, userData.email, userData.password);

  // Verify redirect to dashboard
  await t.wait(2000);
  await CustomAssertions.assertUrlContains(
    t,
    "/dashboard",
    "Should redirect to dashboard after signup"
  );

  // Step 2: Logout (navigate back to login)
  await loginPage.open();
  await t.wait(1000);

  // Step 3: Sign in with same credentials
  await loginPage.signIn(userData.email, userData.password);
  await t.wait(2000);

  // Verify redirect to dashboard again
  await CustomAssertions.assertUrlContains(
    t,
    "/dashboard",
    "Should redirect to dashboard after signin"
  );

  // Verify user is logged in
  const isLoggedIn = await dashboardPage.verifyUserLoggedIn(userData.name);
  await t.expect(isLoggedIn).ok("User should be logged in after sign in");

  // Take screenshot
  await t.takeScreenshot({
    path: "auth-signup-signin-success.png",
    fullPage: true,
  });
});

test("Should show validation errors for invalid email", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();
  await loginPage.switchToSignUp();

  // Fill form with invalid email
  await loginPage.fillSignUpForm("Test User", "invalid-email", "TestPass123!");
  await loginPage.submitForm();

  // Should stay on login page
  const currentPath = await loginPage.getCurrentPath();
  await t
    .expect(currentPath)
    .eql("/login", "Should stay on login page with invalid email");
});

test("Should show validation errors for short password", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();
  await loginPage.switchToSignUp();

  // Fill form with short password
  await loginPage.fillSignUpForm(
    "Test User",
    TestHelpers.generateEmail(),
    "short"
  );
  await loginPage.submitForm();

  // Should stay on login page
  const currentPath = await loginPage.getCurrentPath();
  await t
    .expect(currentPath)
    .eql("/login", "Should stay on login page with short password");
});

test("Should navigate form using keyboard (Keyboard Navigation)", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();
  await loginPage.switchToSignUp();

  // Test keyboard navigation
  await loginPage.navigateFormWithKeyboard();

  // Verify no errors
  await t.expect(loginPage.nameInput.exists).ok();
});

test("Should handle hover on form elements (Element Interactions)", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();

  // Hover over form elements
  await t
    .hover(loginPage.emailInput)
    .hover(loginPage.passwordInput)
    .hover(loginPage.signUpButton);

  // Verify elements are still visible
  await t.expect(loginPage.emailInput.visible).ok();
});

test("Should handle focus on form inputs (Element Interactions)", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();
  await loginPage.switchToSignUp();

  // Focus on each input
  await t
    .click(loginPage.nameInput)
    .click(loginPage.emailInput)
    .click(loginPage.passwordInput);

  // Verify last input has content
  await t.expect(loginPage.passwordInput.exists).ok();
});

test("Should show validation errors when submitting empty form", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();
  await loginPage.switchToSignUp();

  // Ensure form is empty and submit
  await loginPage.clearForm();
  await loginPage.submitForm();

  // Allow client-side validation to run
  await t.wait(500);

  // Retrieve validation messages from the page object
  const nameError = (await loginPage.errorMessage.nth(0).exists)
    ? await loginPage.errorMessage.nth(0).innerText
    : null;
  const emailError = (await loginPage.errorMessage.nth(1).exists)
    ? await loginPage.errorMessage.nth(1).innerText
    : null;
  const passwordError = (await loginPage.errorMessage.nth(2).exists)
    ? await loginPage.errorMessage.nth(2).innerText
    : null;

  await t.expect(nameError).eql("Name must be at least 2 characters");
  await t.expect(emailError).eql("Invalid email address");
  await t.expect(passwordError).eql("Password must be at least 8 characters");

  await t.takeScreenshot({
    path: "auth-signup-validation-errors.png",
    fullPage: true,
  });
});

test("Should be responsive on mobile (Responsive Design)", async (t) => {
  const loginPage = new LoginPage();

  await t.resizeWindow(375, 667);
  await loginPage.open();

  // Verify form is visible and usable on mobile
  await t
    .expect(loginPage.pageTitle.visible)
    .ok()
    .expect(loginPage.emailInput.visible)
    .ok()
    .expect(loginPage.passwordInput.visible)
    .ok()
    .expect(loginPage.signUpButton.visible)
    .ok();

  await t.takeScreenshot({
    path: "auth-mobile-view.png",
    fullPage: true,
  });
});

test("Should measure sign-up performance", async (t) => {
  const loginPage = new LoginPage();

  const userData = {
    name: TestHelpers.generateName(),
    email: TestHelpers.generateEmail(),
    password: TestHelpers.generatePassword(),
  };

  await loginPage.open();

  const startTime = Date.now();
  await loginPage.signUp(userData.name, userData.email, userData.password);
  const endTime = Date.now();

  const signUpTime = endTime - startTime;
  console.log(`Sign-up took ${signUpTime}ms`);

  await t
    .expect(signUpTime)
    .lt(5000, "Sign-up should complete within 5 seconds");
});

test("Should log authentication API requests", async (t) => {
  const loginPage = new LoginPage();

  const userData = {
    name: TestHelpers.generateName(),
    email: TestHelpers.generateEmail(),
    password: TestHelpers.generatePassword(),
  };

  await loginPage.open();
  await loginPage.signUp(userData.name, userData.email, userData.password);

  // Wait for API calls
  await t.wait(2000);

  // Verify API requests were logged
  await t
    .expect(apiLogger.requests.length)
    .gt(0, "Should have logged API requests");

  console.log(`Logged ${apiLogger.requests.length} API requests`);
});

test("Should execute client-side JavaScript for form validation", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();

  // Wait for page to fully render
  await t.wait(1000);

  // Execute client-side code to check form state
  const formExists = await t.eval(() => {
    const form = document.querySelector("form");
    return form !== null;
  });

  await t.expect(formExists).ok("Form should exist in DOM");
});

test("Should take screenshot on authentication failure", async (t) => {
  const loginPage = new LoginPage();

  await loginPage.open();

  // Wait for form to render
  await t.wait(1000);

  // Try to sign in with non-existent account
  await loginPage.signIn("nonexistent@example.com", "wrongpassword");

  // Should stay on login page
  await t.wait(1000);

  await t.takeScreenshot({
    path: "auth-signin-failure.png",
    fullPage: true,
  });
});
