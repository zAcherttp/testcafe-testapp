import { Selector, t } from "testcafe";
import { BasePage } from "./base.page";

/**
 * Todos Page Object
 */
export class TodosPage extends BasePage {
  // Selectors
  readonly pageTitle = Selector("div").withText("Todo List");
  readonly pageDescription = Selector("p").withText(
    "Manage your tasks efficiently"
  );
  readonly todoInput = Selector('input[placeholder*="Add a new task"]');
  readonly addButton = Selector('button[type="submit"]').withText("Add");
  readonly todoList = Selector("ul");
  readonly todoItems = Selector("ul li");
  readonly emptyMessage = Selector("p").withText(
    "No todos yet. Add one above!"
  );
  readonly loadingSpinner = Selector("svg.animate-spin");

  /**
   * Navigate to todos page
   */
  async open(): Promise<void> {
    await this.navigate("/todos");
    await this.waitForPageLoad();
  }

  /**
   * Check if page is loaded
   */
  async isLoaded(): Promise<boolean> {
    // Wait a bit for rendering
    await t.wait(1000);
    return await this.pageTitle.exists;
  }

  /**
   * Wait for todos to load
   */
  async waitForTodosLoad(timeout: number = 5000): Promise<void> {
    // Wait for loading spinner to disappear
    if (await this.loadingSpinner.exists) {
      await t.expect(this.loadingSpinner.exists).notOk({ timeout });
    }
  }

  /**
   * Add a new todo
   */
  async addTodo(text: string): Promise<void> {
    await t
      .typeText(this.todoInput, text, { replace: true })
      .click(this.addButton);

    // Wait for todo to be added
    await this.waitForTodosLoad();
    await t.wait(500);
  }

  /**
   * Get all todo items
   */
  async getTodoItems(): Promise<Selector> {
    return this.todoItems;
  }

  /**
   * Get todo count
   */
  async getTodoCount(): Promise<number> {
    await this.waitForTodosLoad();
    return await this.todoItems.count;
  }

  /**
   * Get todo text by index
   */
  async getTodoText(index: number): Promise<string> {
    const todo = this.todoItems.nth(index);
    const label = todo.find("label");
    return await label.innerText;
  }

  /**
   * Get todo by text
   */
  getTodoByText(text: string): Selector {
    return this.todoItems.find("label").withText(text).parent("li");
  }

  /**
   * Toggle todo completion
   */
  async toggleTodo(index: number): Promise<void> {
    const todo = this.todoItems.nth(index);
    // Checkbox component renders as button with role="checkbox"
    const checkbox = todo.find('button[role="checkbox"]');
    await t.click(checkbox);
    await t.wait(500);
  }

  /**
   * Toggle todo by text
   */
  async toggleTodoByText(text: string): Promise<void> {
    const todo = this.getTodoByText(text);
    // Checkbox component renders as button with role="checkbox"
    const checkbox = todo.find('button[role="checkbox"]');
    await t.click(checkbox);
    await t.wait(500);
  }

  /**
   * Delete todo by index
   */
  async deleteTodo(index: number): Promise<void> {
    const todo = this.todoItems.nth(index);
    const deleteButton = todo.find('button[aria-label="Delete todo"]');
    await t.click(deleteButton);
    await t.wait(500);
  }

  /**
   * Delete todo by text
   */
  async deleteTodoByText(text: string): Promise<void> {
    const todo = this.getTodoByText(text);
    const deleteButton = todo.find('button[aria-label="Delete todo"]');
    await t.click(deleteButton);
    await t.wait(500);
  }

  /**
   * Check if todo is completed
   */
  async isTodoCompleted(index: number): Promise<boolean> {
    const todo = this.todoItems.nth(index);
    // Checkbox component renders as button with role="checkbox"
    const checkbox = todo.find('button[role="checkbox"]');
    const ariaChecked = await checkbox.getAttribute("aria-checked");
    return ariaChecked === "true";
  }

  /**
   * Check if todo exists by text
   */
  async todoExists(text: string): Promise<boolean> {
    const todo = this.getTodoByText(text);
    return await todo.exists;
  }

  /**
   * Check if empty message is shown
   */
  async isEmptyMessageShown(): Promise<boolean> {
    return await this.emptyMessage.exists;
  }

  /**
   * Get all todo texts
   */
  async getAllTodoTexts(): Promise<string[]> {
    await this.waitForTodosLoad();
    const count = await this.getTodoCount();
    const texts: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await this.getTodoText(i);
      texts.push(text);
    }

    return texts;
  }

  /**
   * Get completed todos count
   */
  async getCompletedTodosCount(): Promise<number> {
    await this.waitForTodosLoad();
    const count = await this.getTodoCount();
    let completedCount = 0;

    for (let i = 0; i < count; i++) {
      if (await this.isTodoCompleted(i)) {
        completedCount++;
      }
    }

    return completedCount;
  }

  /**
   * Get incomplete todos count
   */
  async getIncompleteTodosCount(): Promise<number> {
    const total = await this.getTodoCount();
    const completed = await this.getCompletedTodosCount();
    return total - completed;
  }

  /**
   * Clear all todos
   */
  async clearAllTodos(): Promise<void> {
    let count = await this.getTodoCount();

    while (count > 0) {
      await this.deleteTodo(0);
      await this.waitForTodosLoad();
      count = await this.getTodoCount();
    }
  }

  /**
   * Check if add button is disabled
   */
  async isAddButtonDisabled(): Promise<boolean> {
    const disabled = await this.addButton.getAttribute("disabled");
    return disabled !== null;
  }

  /**
   * Get input value
   */
  async getInputValue(): Promise<string> {
    const value = await this.todoInput.value;
    return value ?? "";
  }

  /**
   * Clear input
   */
  async clearInput(): Promise<void> {
    await t.selectText(this.todoInput).pressKey("delete");
  }

  /**
   * Hover over todo item
   */
  async hoverOverTodo(index: number): Promise<void> {
    const todo = this.todoItems.nth(index);
    await t.hover(todo);
  }

  /**
   * Focus on todo input
   */
  async focusInput(): Promise<void> {
    await t.click(this.todoInput);
  }

  /**
   * Test keyboard interaction - Add todo with Enter key
   */
  async addTodoWithEnterKey(text: string): Promise<void> {
    await t.typeText(this.todoInput, text, { replace: true }).pressKey("enter");

    await this.waitForTodosLoad();
    await t.wait(500);
  }

  /**
   * Get todo item element
   */
  getTodoItem(index: number): Selector {
    return this.todoItems.nth(index);
  }

  /**
   * Get checkbox for todo
   */
  getTodoCheckbox(index: number): Selector {
    // Checkbox component renders as button with role="checkbox"
    return this.todoItems.nth(index).find('button[role="checkbox"]');
  }

  /**
   * Get delete button for todo
   */
  getTodoDeleteButton(index: number): Selector {
    return this.todoItems.nth(index).find('button[aria-label="Delete todo"]');
  }

  /**
   * Verify todo has strikethrough (completed style)
   */
  async todoHasStrikethrough(index: number): Promise<boolean> {
    const todo = this.todoItems.nth(index);
    const label = todo.find("label");
    const className = await label.getAttribute("class");
    return className ? className.includes("line-through") : false;
  }
}
