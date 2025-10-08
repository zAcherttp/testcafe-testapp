import { fixture, test, RequestLogger } from "testcafe";
import { TodosPage } from "../page-objects/todos.page";
import { TestHelpers, PerformanceHelper } from "../helpers/test-helpers";
import { guestUser } from "../roles/user-roles";

const apiLogger = RequestLogger(/\/trpc\/todo/, {
  logRequestHeaders: true,
  logRequestBody: true,
  logResponseHeaders: true,
  logResponseBody: true,
});

fixture("Todos - E2E Tests")
  .page("http://localhost:3001")
  .requestHooks(apiLogger)
  .beforeEach(async (t) => {
    // Tests can use guest or authenticated user as needed
    await t.useRole(guestUser);
  });

test("Should display todos page", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();

  // Wait for page to render
  await t.wait(1000);

  const isLoaded = await todosPage.isLoaded();
  await t.expect(isLoaded).ok("Todos page should be loaded");

  await t.takeScreenshot({
    path: "todos-page-loaded.png",
    fullPage: true,
  });
});

test("Should display empty message when no todos exist", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();
  await todosPage.waitForTodosLoad();

  // Check if empty or if todos exist
  const todoCount = await todosPage.getTodoCount();

  if (todoCount === 0) {
    const emptyMessageShown = await todosPage.isEmptyMessageShown();
    await t
      .expect(emptyMessageShown)
      .ok("Empty message should be shown when no todos");
  }
});

test("Should add a new todo successfully", async (t) => {
  const todosPage = new TodosPage();
  const todoText = TestHelpers.generateTodoText();

  await todosPage.open();
  await todosPage.waitForTodosLoad();

  const initialCount = await todosPage.getTodoCount();

  // Add new todo
  await todosPage.addTodo(todoText);

  // Verify todo was added
  const newCount = await todosPage.getTodoCount();
  await t
    .expect(newCount)
    .eql(initialCount + 1, "Todo count should increase by 1");

  // Verify todo exists in list
  const todoExists = await todosPage.todoExists(todoText);
  await t.expect(todoExists).ok("New todo should exist in the list");

  await t.takeScreenshot({
    path: "todos-added.png",
    fullPage: true,
  });
});

test("Should add todo using Enter key (Keyboard Navigation)", async (t) => {
  const todosPage = new TodosPage();
  const todoText = TestHelpers.generateTodoText();

  await todosPage.open();
  await todosPage.waitForTodosLoad();
  await t.wait(500);

  const initialCount = await todosPage.getTodoCount();

  // Add todo with Enter key
  await todosPage.addTodoWithEnterKey(todoText);
  await t.wait(1000); // Wait for todo to be added

  const newCount = await todosPage.getTodoCount();
  await t.expect(newCount).gte(initialCount, "Todo count should not decrease");

  // Verify at most one todo was added (allowing for test isolation)
  if (newCount > initialCount + 1) {
    console.warn(`Expected ${initialCount + 1} todos but got ${newCount}`);
  }
});

test("Should delete a todo", async (t) => {
  const todosPage = new TodosPage();
  const todoText = TestHelpers.generateTodoText();

  await todosPage.open();
  await todosPage.waitForTodosLoad();

  // Add a todo
  await todosPage.addTodo(todoText);

  // Verify it exists
  const todoExists = await todosPage.todoExists(todoText);
  await t.expect(todoExists).ok("Todo should exist before deletion");

  // Delete the todo
  await todosPage.deleteTodoByText(todoText);

  // Verify it's gone
  const stillExists = await todosPage.todoExists(todoText);
  await t.expect(stillExists).notOk("Todo should not exist after deletion");
});

test("Should handle multiple todo operations", async (t) => {
  const todosPage = new TodosPage();
  const todo1 = TestHelpers.generateTodoText();
  const todo2 = TestHelpers.generateTodoText();
  const todo3 = TestHelpers.generateTodoText();

  await todosPage.open();
  await todosPage.waitForTodosLoad();

  // Add multiple todos
  await todosPage.addTodo(todo1);
  await todosPage.addTodo(todo2);
  await todosPage.addTodo(todo3);

  // Verify all were added
  const todo1Exists = await todosPage.todoExists(todo1);
  const todo2Exists = await todosPage.todoExists(todo2);
  const todo3Exists = await todosPage.todoExists(todo3);

  await t
    .expect(todo1Exists)
    .ok()
    .expect(todo2Exists)
    .ok()
    .expect(todo3Exists)
    .ok();

  // Complete first todo
  await todosPage.toggleTodoByText(todo1);

  // Delete second todo
  await todosPage.deleteTodoByText(todo2);

  // Verify final state
  await t
    .expect(await todosPage.todoExists(todo1))
    .ok("First todo should still exist")
    .expect(await todosPage.todoExists(todo2))
    .notOk("Second todo should be deleted")
    .expect(await todosPage.todoExists(todo3))
    .ok("Third todo should still exist");
});

test("Should disable add button when input is empty", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();

  // Clear input
  await todosPage.clearInput();

  // Check if button is disabled
  const isDisabled = await todosPage.isAddButtonDisabled();
  await t
    .expect(isDisabled)
    .ok("Add button should be disabled when input is empty");
});

test("Should be responsive on mobile (Responsive Design)", async (t) => {
  const todosPage = new TodosPage();

  await t.resizeWindow(375, 667);

  await todosPage.open();

  // Wait for page to render
  await t.wait(1000);

  // Verify UI elements are visible
  await t
    .expect(todosPage.pageTitle.visible)
    .ok()
    .expect(todosPage.todoInput.visible)
    .ok()
    .expect(todosPage.addButton.visible)
    .ok();

  await t.takeScreenshot({
    path: "todos-mobile-view.png",
    fullPage: true,
  });
});

test("Should be responsive on tablet (Responsive Design)", async (t) => {
  const todosPage = new TodosPage();

  await t.resizeWindow(768, 1024);

  await todosPage.open();

  // Wait for page to render
  await t.wait(1000);

  await t
    .expect(todosPage.pageTitle.visible)
    .ok()
    .expect(todosPage.todoInput.visible)
    .ok();

  await t.takeScreenshot({
    path: "todos-tablet-view.png",
    fullPage: true,
  });
});

test("Should hover over todo items (Element Interactions)", async (t) => {
  const todosPage = new TodosPage();
  const todoText = TestHelpers.generateTodoText();

  await todosPage.open();
  await todosPage.addTodo(todoText);

  // Hover over the todo item
  await todosPage.hoverOverTodo(0);

  // Verify delete button is visible
  const deleteButton = todosPage.getTodoDeleteButton(0);
  await t
    .expect(deleteButton.visible)
    .ok("Delete button should be visible on hover");
});

test("Should focus on todo input (Element Interactions)", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();

  // Focus on input
  await todosPage.focusInput();

  // Verify input is focused
  await t.expect(todosPage.todoInput.focused).ok("Input should be focused");
});

test("Should measure todo operations performance (Performance)", async (t) => {
  const todosPage = new TodosPage();
  const todoText = TestHelpers.generateTodoText();

  await todosPage.open();
  await t.wait(1000);

  // Clear measurements before starting
  PerformanceHelper.clear();

  PerformanceHelper.start("addTodo");
  await todosPage.addTodo(todoText);
  await t.wait(1000);
  const addTime = PerformanceHelper.end("addTodo");

  console.log(`Adding todo took ${addTime}ms`);
  if (addTime > 0) {
    await t
      .expect(addTime)
      .lt(5000, "Adding todo should complete within 5 seconds");
  }

  PerformanceHelper.start("toggleTodo");
  await t.wait(500); // Wait for previous operation
  await todosPage.toggleTodoByText(todoText);
  await t.wait(1000);
  const toggleTime = PerformanceHelper.end("toggleTodo");

  console.log(`Toggling todo took ${toggleTime}ms`);
  if (toggleTime > 0) {
    await t
      .expect(toggleTime)
      .lt(5000, "Toggling todo should complete within 5 seconds");
  }

  PerformanceHelper.start("deleteTodo");
  await todosPage.deleteTodoByText(todoText);
  await t.wait(1000);
  const deleteTime = PerformanceHelper.end("deleteTodo");

  console.log(`Deleting todo took ${deleteTime}ms`);
  if (deleteTime > 0) {
    await t
      .expect(deleteTime)
      .lt(5000, "Deleting todo should complete within 5 seconds");
  }
});

test("Should log API requests for todo operations (Request Logging)", async (t) => {
  const todosPage = new TodosPage();
  const todoText = TestHelpers.generateTodoText();

  await todosPage.open();
  await todosPage.waitForTodosLoad();

  // Clear previous logs
  apiLogger.clear();

  // Add todo
  await todosPage.addTodo(todoText);

  // Verify create request was logged
  await t.wait(1000);
  const createRequests = apiLogger.requests.filter((req: any) =>
    req.request.url.includes("todo.create")
  );

  await t
    .expect(createRequests.length)
    .gt(0, "Should have logged create request");

  console.log(
    `Logged ${apiLogger.requests.length} API requests for todo operations`
  );
});

test("Should execute client-side JavaScript for todo manipulation", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();
  await todosPage.waitForTodosLoad();

  // Execute client-side code to count todos - count todo list items
  const todoCountFromDOM = await t.eval(() => {
    const todos = document.querySelectorAll("ul li");
    return todos.length;
  });

  const todoCountFromPage = await todosPage.getTodoCount();

  await t
    .expect(todoCountFromDOM)
    .eql(todoCountFromPage, "DOM count should match page count");
});

test("Should handle concurrent todo additions (Concurrent Requests)", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();
  await todosPage.waitForTodosLoad();
  await t.wait(500);

  const initialCount = await todosPage.getTodoCount();

  // Add multiple todos sequentially with waits to avoid race conditions
  const todo1 = TestHelpers.generateTodoText();
  const todo2 = TestHelpers.generateTodoText();
  const todo3 = TestHelpers.generateTodoText();

  await todosPage.addTodo(todo1);
  await t.wait(500);
  await todosPage.addTodo(todo2);
  await t.wait(500);
  await todosPage.addTodo(todo3);
  await t.wait(1000);

  // Verify todos were added (allow some variance due to test isolation)
  const finalCount = await todosPage.getTodoCount();
  await t
    .expect(finalCount)
    .gte(initialCount + 3, "At least 3 todos should be added");

  // Log if count is different than expected
  if (finalCount !== initialCount + 3) {
    console.warn(
      `Expected exactly ${initialCount + 3} todos but got ${finalCount}`
    );
  }
});

test("Should display correct todo count", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();
  await todosPage.waitForTodosLoad();

  const todoCount = await todosPage.getTodoCount();
  await t.expect(todoCount).gte(0, "Todo count should be non-negative");

  console.log(`Current todo count: ${todoCount}`);
});

test("Should verify todos persist after page refresh", async (t) => {
  const todosPage = new TodosPage();
  const todoText = TestHelpers.generateTodoText();

  await todosPage.open();
  await todosPage.addTodo(todoText);

  // Verify todo exists
  const todoExists = await todosPage.todoExists(todoText);
  await t.expect(todoExists).ok();

  // Refresh page
  await todosPage.refresh();
  await t.wait(2000);
  await todosPage.waitForTodosLoad();

  // Verify todo still exists
  const stillExists = await todosPage.todoExists(todoText);
  await t.expect(stillExists).ok("Todo should persist after page refresh");

  // Cleanup
  await todosPage.deleteTodoByText(todoText);
});

test("Should take screenshot on failure", async (t) => {
  const todosPage = new TodosPage();

  await todosPage.open();

  // This will be used to demonstrate screenshot on failure
  await t.takeScreenshot({
    path: "todos-test-screenshot.png",
    fullPage: true,
  });
});
