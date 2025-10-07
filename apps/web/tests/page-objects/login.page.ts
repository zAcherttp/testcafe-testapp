import { Selector, t } from "testcafe";
import { BasePage } from "./base.page";

/**
 * Login Page Object - Handles both Sign In and Sign Up forms
 */
export class LoginPage extends BasePage {
  // Common selectors
  readonly pageTitle = Selector("h1");

  // Sign Up form selectors
  readonly signUpTitle = Selector("h1").withText("Create Account");
  readonly nameInput = Selector('input[name="name"]');
  readonly emailInput = Selector('input[name="email"]');
  readonly passwordInput = Selector('input[name="password"]');
  readonly signUpButton = Selector('button[type="submit"]').withText(
    /Sign Up/i
  );
  readonly switchToSignInButton = Selector("button").withText(
    /Already have an account/i
  );

  // Sign In form selectors
  readonly signInTitle = Selector("h1").withText("Welcome Back");
  readonly signInEmailInput = Selector('input[name="email"]');
  readonly signInPasswordInput = Selector('input[name="password"]');
  readonly signInButton = Selector('button[type="submit"]').withText(
    /Sign In/i
  );

  readonly switchToSignUpButton =
    Selector("button").withText(/Need an account/i);

  // Error messages
  readonly errorMessage = Selector("p").withAttribute("class", /text-red-500/);

  /**
   * Navigate to login page
   */
  async open(): Promise<void> {
    await this.navigate("/login");
    await this.waitForPageLoad();
  }

  /**
   * Check if on sign-up form
   */
  async isOnSignUpForm(): Promise<boolean> {
    return await this.signUpTitle.exists;
  }

  /**
   * Check if on sign-in form
   */
  async isOnSignInForm(): Promise<boolean> {
    return await this.signInTitle.exists;
  }

  /**
   * Switch to Sign In form
   */
  async switchToSignIn(): Promise<void> {
    if (await this.isOnSignUpForm()) {
      await t.click(this.switchToSignInButton);
      await this.waitForElement(this.signInTitle);
    }
  }

  /**
   * Switch to Sign Up form
   */
  async switchToSignUp(): Promise<void> {
    if (await this.isOnSignInForm()) {
      await t.click(this.switchToSignUpButton);
      await this.waitForElement(this.signUpTitle);
    }
  }

  /**
   * Sign up with new account
   */
  async signUp(name: string, email: string, password: string): Promise<void> {
    await this.switchToSignUp();

    await t
      .typeText(this.nameInput, name, { replace: true })
      .typeText(this.emailInput, email, { replace: true })
      .typeText(this.passwordInput, password, { replace: true })
      .click(this.signUpButton);

    // Wait for navigation or error
    await t.wait(2000);
  }

  /**
   * Sign in with existing account
   */
  async signIn(email: string, password: string): Promise<void> {
    await this.switchToSignIn();

    // Wait for form to be ready
    await t.wait(500);

    await t
      .typeText(this.signInEmailInput, email, { replace: true })
      .typeText(this.signInPasswordInput, password, { replace: true });

    // Wait for button to be ready and click
    await this.waitForElement(this.signInButton, 5000);
    await t.click(this.signInButton);

    // Wait for navigation or error
    await t.wait(2000);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.exists) {
      return await this.errorMessage.innerText;
    }
    return null;
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.exists;
  }

  /**
   * Fill sign up form without submitting
   */
  async fillSignUpForm(
    name: string,
    email: string,
    password: string
  ): Promise<void> {
    await this.switchToSignUp();

    await t
      .typeText(this.nameInput, name, { replace: true })
      .typeText(this.emailInput, email, { replace: true })
      .typeText(this.passwordInput, password, { replace: true });
  }

  /**
   * Fill sign in form without submitting
   */
  async fillSignInForm(email: string, password: string): Promise<void> {
    await this.switchToSignIn();

    await t
      .typeText(this.signInEmailInput, email, { replace: true })
      .typeText(this.signInPasswordInput, password, { replace: true });
  }

  /**
   * Submit the active form
   */
  async submitForm(): Promise<void> {
    const isSignUp = await this.isOnSignUpForm();

    if (isSignUp) {
      await t.click(this.signUpButton);
    } else {
      await t.click(this.signInButton);
    }

    await t.wait(2000);
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    const isSignUp = await this.isOnSignUpForm();
    const button = isSignUp ? this.signUpButton : this.signInButton;
    const disabled = await button.getAttribute("disabled");
    return disabled !== null;
  }

  /**
   * Get form title
   */
  async getFormTitle(): Promise<string> {
    return await this.pageTitle.innerText;
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    const isSignUp = await this.isOnSignUpForm();

    if (isSignUp) {
      await t
        .selectText(this.nameInput)
        .pressKey("delete")
        .selectText(this.emailInput)
        .pressKey("delete")
        .selectText(this.passwordInput)
        .pressKey("delete");
    } else {
      await t
        .selectText(this.signInEmailInput)
        .pressKey("delete")
        .selectText(this.signInPasswordInput)
        .pressKey("delete");
    }
  }

  /**
   * Test keyboard navigation
   */
  async navigateFormWithKeyboard(): Promise<void> {
    const isSignUp = await this.isOnSignUpForm();

    if (isSignUp) {
      await t
        .click(this.nameInput)
        .pressKey("tab") // Move to email
        .pressKey("tab") // Move to password
        .pressKey("tab"); // Move to submit button
    } else {
      await t
        .click(this.signInEmailInput)
        .pressKey("tab") // Move to password
        .pressKey("tab"); // Move to submit button
    }
  }

  /**
   * Verify field has focus
   */
  async fieldHasFocus(selector: Selector): Promise<boolean> {
    const focusedElement = await t.eval(() => document.activeElement);
    const element = await selector();
    return focusedElement === element;
  }

  /**
   * Test form validation
   */
  async triggerValidation(): Promise<void> {
    // Focus and blur fields to trigger validation
    const isSignUp = await this.isOnSignUpForm();

    if (isSignUp) {
      await t
        .click(this.nameInput)
        .click(this.emailInput)
        .click(this.passwordInput)
        .click(this.nameInput);
    } else {
      await t
        .click(this.signInEmailInput)
        .click(this.signInPasswordInput)
        .click(this.signInEmailInput);
    }
  }
}
