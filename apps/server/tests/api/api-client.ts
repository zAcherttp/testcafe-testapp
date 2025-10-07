import { RequestLogger } from "testcafe";

/**
 * HTTP client for testing APIs
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a tRPC query request
   */
  async query(procedure: string, input?: any): Promise<any> {
    const url = new URL(`${this.baseUrl}/trpc/${procedure}`);

    if (input) {
      url.searchParams.append("input", JSON.stringify(input));
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.result?.data;
  }

  /**
   * Make a tRPC mutation request
   */
  async mutate(procedure: string, input: any): Promise<any> {
    const url = `${this.baseUrl}/trpc/${procedure}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.result?.data;
  }

  /**
   * Make a batch tRPC request
   */
  async batch(
    requests: Array<{
      type: "query" | "mutation";
      procedure: string;
      input?: any;
    }>
  ): Promise<any[]> {
    const url = `${this.baseUrl}/trpc`;

    const batchPayload = requests.map((req, index) => ({
      id: index,
      jsonrpc: "2.0",
      method: req.type,
      params: {
        path: req.procedure,
        input: req.input,
      },
    }));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batchPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.map((item: any) => item.result?.data);
  }

  /**
   * Create a RequestLogger for monitoring requests
   */
  createRequestLogger(urlPattern: string | RegExp): RequestLogger {
    return RequestLogger(urlPattern, {
      logRequestHeaders: true,
      logRequestBody: true,
      logResponseHeaders: true,
      logResponseBody: true,
      stringifyRequestBody: true,
      stringifyResponseBody: true,
    });
  }

  /**
   * Helper to test API directly without TestCafe
   */
  static async testDirectFetch(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    return await fetch(url, options);
  }
}

/**
 * Test data generators for API tests
 */
export class ApiTestHelpers {
  static generateTodoText(): string {
    return `Test Todo ${Date.now()} - ${Math.random()
      .toString(36)
      .substring(7)}`;
  }

  static generateEmail(): string {
    return `test-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}@example.com`;
  }

  static generateUserData() {
    return {
      name: `Test User ${Date.now()}`,
      email: this.generateEmail(),
      password: `TestPass${Date.now()}!`,
    };
  }

  static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
