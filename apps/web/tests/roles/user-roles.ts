import { Role } from "testcafe";
import { LoginPage } from "../page-objects/login.page";
import { TestHelpers } from "../helpers/test-helpers";

const baseUrl = "http://localhost:3001";

/**
 * Regular User Role - Authenticated user for testing protected routes
 */
export const regularUser = Role(
  `${baseUrl}/login`,
  async (t) => {
    const loginPage = new LoginPage();

    // Create unique user credentials for this role
    const userData = {
      name: TestHelpers.generateName(),
      email: TestHelpers.generateEmail(),
      password: TestHelpers.generatePassword(),
    };

    // Sign up
    await loginPage.signUp(userData.name, userData.email, userData.password);

    // Wait for redirect to dashboard
    await t.wait(2000);
  },
  {
    preserveUrl: true,
  }
);

/**
 * Guest User Role - Unauthenticated user
 */
export const guestUser = Role(`${baseUrl}/`, async (t) => {
  // Clear any existing authentication
  await t.eval(() => {
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  });

  await t.wait(500);
});

/**
 * Admin User Role - Could be extended for admin-specific tests
 */
export const adminUser = Role(
  `${baseUrl}/login`,
  async (t) => {
    const loginPage = new LoginPage();

    const userData = {
      name: "Admin User",
      email: TestHelpers.generateEmail(),
      password: TestHelpers.generatePassword(),
    };

    await loginPage.signUp(userData.name, userData.email, userData.password);
    await t.wait(2000);
  },
  {
    preserveUrl: true,
  }
);

/**
 * Create a custom user role with specific credentials
 */
export function createCustomUserRole(
  name: string,
  email: string,
  password: string
): Role {
  return Role(
    `${baseUrl}/login`,
    async (t) => {
      const loginPage = new LoginPage();

      // Try to sign in first
      await loginPage.signIn(email, password);
      await t.wait(1000);

      // If sign in failed, sign up
      const currentPath = await t.eval(() => window.location.pathname);
      if (currentPath === "/login") {
        await loginPage.signUp(name, email, password);
        await t.wait(2000);
      }
    },
    {
      preserveUrl: true,
    }
  );
}

/**
 * Quick login helper for creating one-off authenticated users
 */
export async function quickLogin(
  t: TestController,
  options?: {
    name?: string;
    email?: string;
    password?: string;
  }
): Promise<{ name: string; email: string; password: string }> {
  const loginPage = new LoginPage();

  const userData = {
    name: options?.name || TestHelpers.generateName(),
    email: options?.email || TestHelpers.generateEmail(),
    password: options?.password || TestHelpers.generatePassword(),
  };

  await loginPage.navigate("/login");
  await loginPage.signUp(userData.name, userData.email, userData.password);
  await t.wait(2000);

  return userData;
}

/**
 * Logout helper
 */
export async function logout(t: TestController): Promise<void> {
  // Clear authentication
  await t.eval(() => {
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
  });

  // Navigate to home
  await t.navigateTo("http://localhost:3001/");
  await t.wait(500);
}

// Type definitions
declare global {
  interface TestController {
    // Type definitions for TestCafe
  }
}
