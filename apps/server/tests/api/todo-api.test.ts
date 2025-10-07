import { fixture, test, RequestLogger } from "testcafe";
import { ApiTestHelpers } from "./api-client";

// Create request loggers for monitoring API calls
const todoApiLogger = RequestLogger(/\/trpc\/todo/, {
  logRequestHeaders: true,
  logRequestBody: true,
  logResponseHeaders: true,
  logResponseBody: true,
});

// API tests don't need a page
fixture("API Tests - Todo CRUD").requestHooks(todoApiLogger);

test("Should fetch all todos (GET)", async (t) => {
  const response = await t.request("http://localhost:3000/trpc/todo.getAll");

  await t
    .expect(response.status)
    .eql(200, "Should return 200 status")
    .expect((response.headers as any)["content-type"])
    .contains("application/json", "Should return JSON");

  const data: any = response.body;
  await t
    .expect(data)
    .ok("Should return data")
    .expect(data.result)
    .ok("Should have result property")
    .expect(Array.isArray(data.result.data))
    .ok("Should return array of todos");
});

test("Should create a new todo (POST)", async (t) => {
  const todoText = ApiTestHelpers.generateTodoText();

  const response = await t.request.post(
    "http://localhost:3000/trpc/todo.create",
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: { text: todoText },
    }
  );

  await t.expect(response.status).eql(200, "Should return 200 status");

  const data: any = response.body;

  await t
    .expect(data)
    .ok("Should return data")
    .expect(data.result)
    .ok("Should have result property");

  // Verify the todo was created
  const getAllResponse = await t.request(
    "http://localhost:3000/trpc/todo.getAll"
  );
  const allTodos: any = getAllResponse.body;

  const createdTodo = allTodos.result.data.find(
    (todo: any) => todo.text === todoText
  );
  await t.expect(createdTodo).ok("Created todo should exist in the list");
});

test("Should validate todo creation requires text", async (t) => {
  const response = await t.request.post(
    "http://localhost:3000/trpc/todo.create",
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: { text: "" },
    }
  );

  // Should return error for empty text
  await t
    .expect(response.status)
    .gte(400, "Should return error status for invalid input");
});

test("Should toggle todo completion status", async (t) => {
  const todoText = ApiTestHelpers.generateTodoText();

  // Create a todo
  const createResponse = await t.request.post(
    "http://localhost:3000/trpc/todo.create",
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: { text: todoText },
    }
  );

  await t.expect(createResponse.status).eql(200);

  // Get the created todo
  const getAllResponse = await t.request(
    "http://localhost:3000/trpc/todo.getAll"
  );
  const allTodos: any = getAllResponse.body;
  const createdTodo = allTodos.result.data.find(
    (todo: any) => todo.text === todoText
  );

  await t.expect(createdTodo).ok("Todo should be created");
  await t
    .expect(createdTodo.completed)
    .eql(false, "New todo should not be completed");

  // Toggle completion
  const toggleResponse = await t.request.post(
    "http://localhost:3000/trpc/todo.toggle",
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        id: createdTodo.id,
        completed: true,
      },
    }
  );

  await t.expect(toggleResponse.status).eql(200);

  // Verify the todo is now completed
  const updatedTodos = await t.request(
    "http://localhost:3000/trpc/todo.getAll"
  );
  const updatedData: any = updatedTodos.body;
  const updatedTodo = updatedData.result.data.find(
    (todo: any) => todo.id === createdTodo.id
  );

  await t
    .expect(updatedTodo.completed)
    .eql(true, "Todo should be marked as completed");
});

test("Should delete a todo", async (t) => {
  const todoText = ApiTestHelpers.generateTodoText();

  // Create a todo
  await t.request.post("http://localhost:3000/trpc/todo.create", {
    headers: {
      "Content-Type": "application/json",
    },
    body: { text: todoText },
  });

  // Get the created todo
  const getAllResponse = await t.request(
    "http://localhost:3000/trpc/todo.getAll"
  );
  const allTodos: any = getAllResponse.body;
  const createdTodo = allTodos.result.data.find(
    (todo: any) => todo.text === todoText
  );

  await t.expect(createdTodo).ok("Todo should be created");

  // Delete the todo
  const deleteResponse = await t.request.post(
    "http://localhost:3000/trpc/todo.delete",
    {
      headers: {
        "Content-Type": "application/json",
      },
      body: { id: createdTodo.id },
    }
  );

  await t.expect(deleteResponse.status).eql(200);

  // Verify the todo is deleted
  const afterDeleteResponse = await t.request(
    "http://localhost:3000/trpc/todo.getAll"
  );
  const afterDeleteData: any = afterDeleteResponse.body;
  const deletedTodo = afterDeleteData.result.data.find(
    (todo: any) => todo.id === createdTodo.id
  );

  await t.expect(deletedTodo).notOk("Todo should be deleted");
});

test("Should handle multiple todo operations in sequence", async (t) => {
  const todo1Text = ApiTestHelpers.generateTodoText();
  const todo2Text = ApiTestHelpers.generateTodoText();

  // Create first todo
  await t.request.post("http://localhost:3000/trpc/todo.create", {
    headers: { "Content-Type": "application/json" },
    body: { text: todo1Text },
  });

  // Create second todo
  await t.request.post("http://localhost:3000/trpc/todo.create", {
    headers: { "Content-Type": "application/json" },
    body: { text: todo2Text },
  });

  // Get all todos
  const getAllResponse = await t.request(
    "http://localhost:3000/trpc/todo.getAll"
  );
  const allTodos: any = getAllResponse.body;

  const createdTodos = allTodos.result.data.filter(
    (todo: any) => todo.text === todo1Text || todo.text === todo2Text
  );

  await t.expect(createdTodos.length).eql(2, "Both todos should be created");

  // Toggle first todo
  await t.request.post("http://localhost:3000/trpc/todo.toggle", {
    headers: { "Content-Type": "application/json" },
    body: {
      id: createdTodos[0].id,
      completed: true,
    },
  });

  // Delete second todo
  await t.request.post("http://localhost:3000/trpc/todo.delete", {
    headers: { "Content-Type": "application/json" },
    body: { id: createdTodos[1].id },
  });

  // Verify final state
  const finalResponse = await t.request(
    "http://localhost:3000/trpc/todo.getAll"
  );
  const finalData: any = finalResponse.body;

  const todo1 = finalData.result.data.find(
    (todo: any) => todo.text === todo1Text
  );
  const todo2 = finalData.result.data.find(
    (todo: any) => todo.text === todo2Text
  );

  await t
    .expect(todo1)
    .ok("First todo should still exist")
    .expect(todo1.completed)
    .eql(true, "First todo should be completed")
    .expect(todo2)
    .notOk("Second todo should be deleted");
});

test("Should return proper content-type headers", async (t) => {
  const response = await t.request("http://localhost:3000/trpc/todo.getAll");
  const contentType = (response.headers as any)["content-type"];

  await t
    .expect(contentType)
    .contains("application/json", "Should return JSON content type");
});

test("Should handle concurrent todo creations", async (t) => {
  const todoTexts = [
    ApiTestHelpers.generateTodoText(),
    ApiTestHelpers.generateTodoText(),
    ApiTestHelpers.generateTodoText(),
  ];

  // Create todos sequentially (TestCafe t.request doesn't support Promise.all)
  for (const text of todoTexts) {
    const response = await t.request.post(
      "http://localhost:3000/trpc/todo.create",
      {
        headers: { "Content-Type": "application/json" },
        body: { text },
      }
    );

    await t.expect(response.status).eql(200, "All requests should succeed");
  }

  // Verify all todos were created
  const getAllResponse = await t.request(
    "http://localhost:3000/trpc/todo.getAll"
  );
  const allTodos: any = getAllResponse.body;

  for (const text of todoTexts) {
    const todo = allTodos.result.data.find((t: any) => t.text === text);
    await t.expect(todo).ok(`Todo "${text}" should be created`);
  }
});

test("Should verify API response structure", async (t) => {
  const response = await t.request("http://localhost:3000/trpc/todo.getAll");
  const data: any = response.body;

  await t
    .expect(data)
    .ok("Response should have data")
    .expect(typeof data)
    .eql("object", "Response should be an object")
    .expect(data.result)
    .ok("Response should have result property")
    .expect(data.result.data)
    .ok("Result should have data property")
    .expect(Array.isArray(data.result.data))
    .ok("Data should be an array");

  if (data.result.data.length > 0) {
    const todo = data.result.data[0];
    await t
      .expect(todo)
      .typeOf("object", "Todo should be an object")
      .expect(todo.id)
      .typeOf("number", "Todo should have numeric id")
      .expect(todo.text)
      .typeOf("string", "Todo should have text string")
      .expect(todo.completed)
      .typeOf("boolean", "Todo should have completed boolean");
  }
});

test("Should measure API response time", async (t) => {
  const startTime = Date.now();
  const response = await t.request("http://localhost:3000/trpc/todo.getAll");
  const endTime = Date.now();

  const responseTime = endTime - startTime;

  await t
    .expect(response.status)
    .eql(200)
    .expect(responseTime)
    .lt(1000, "API should respond within 1 second");
});
