import { test, expect, Page } from '@playwright/test'
import { captureScreenshot } from './helpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function addTodo(page: Page, text: string) {
  await page.getByTestId('todo-input').fill(text)
  await page.keyboard.press('Enter')
}

// ─── Tests ────────────────────────────────────────────────────────────────────
test.describe('DarkTodo App', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage before each test for a clean state
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  // 1. Happy path: add a new todo
  test('adds a new todo by typing and pressing Enter', async ({ page }) => {
    await addTodo(page, 'Buy groceries')
    const items = page.getByTestId('todo-item')
    await expect(items).toHaveCount(1)
    await expect(page.getByTestId('todo-text').first()).toHaveText('Buy groceries')
    // Checkbox should be unchecked (no completed class)
    await expect(page.getByTestId('todo-checkbox').first()).toBeVisible()
    await expect(page.getByTestId('delete-button').first()).toBeVisible()
  })

  // 2. Happy path: mark todo as complete
  test('marks a todo as completed when checkbox is clicked', async ({ page }) => {
    await addTodo(page, 'Read a book')
    await addTodo(page, 'Go for a run')

    // Initial count should be 2 items left
    await expect(page.getByTestId('item-count')).toHaveText('2 items left')

    // Click the first checkbox
    await page.getByTestId('todo-checkbox').first().click()

    // Text should have line-through style
    const todoText = page.getByTestId('todo-text').first()
    await expect(todoText).toHaveCSS('text-decoration-line', 'line-through')

    // Count should decrement
    await expect(page.getByTestId('item-count')).toHaveText('1 item left')
  })

  // 3. Happy path: delete a todo
  test('deletes a todo when the delete button is clicked', async ({ page }) => {
    await addTodo(page, 'Task to delete')
    await addTodo(page, 'Task to keep')
    await expect(page.getByTestId('todo-item')).toHaveCount(2)

    // Delete the first item
    await page.getByTestId('delete-button').first().click()
    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-text').first()).toHaveText('Task to keep')
  })

  // 4. Happy path: clear completed todos
  test('clears all completed todos when Clear Completed is clicked', async ({ page }) => {
    await addTodo(page, 'Active task')
    await addTodo(page, 'Done task 1')
    await addTodo(page, 'Done task 2')

    // Complete the 2nd and 3rd tasks
    const checkboxes = page.getByTestId('todo-checkbox')
    await checkboxes.nth(1).click()
    await checkboxes.nth(2).click()

    await page.getByTestId('clear-completed').click()

    // Only active task should remain
    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-text').first()).toHaveText('Active task')
  })

  // 5. Filter behavior
  test('filters todos by All, Active, and Completed tabs', async ({ page }) => {
    await addTodo(page, 'Active 1')
    await addTodo(page, 'Active 2')
    await addTodo(page, 'Completed 1')

    // Complete the third task
    await page.getByTestId('todo-checkbox').nth(2).click()

    // Active filter
    await page.getByTestId('filter-active').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(2)
    await expect(page.getByTestId('todo-text').nth(0)).toHaveText('Active 1')
    await expect(page.getByTestId('todo-text').nth(1)).toHaveText('Active 2')

    // Completed filter
    await page.getByTestId('filter-completed').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(1)
    await expect(page.getByTestId('todo-text').first()).toHaveText('Completed 1')

    // All filter
    await page.getByTestId('filter-all').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(3)
  })

  // 6. Data persistence across page reload
  test('persists todos across page reloads', async ({ page }) => {
    await addTodo(page, 'Persistent task 1')
    await addTodo(page, 'Persistent task 2')

    // Complete the first
    await page.getByTestId('todo-checkbox').first().click()

    // Reload the page (localStorage should persist)
    await page.reload()

    const items = page.getByTestId('todo-item')
    await expect(items).toHaveCount(2)

    // First item should still be completed (strikethrough)
    const firstText = page.getByTestId('todo-text').first()
    await expect(firstText).toHaveCSS('text-decoration-line', 'line-through')
    await expect(page.getByTestId('todo-text').nth(1)).not.toHaveCSS('text-decoration-line', 'line-through')
  })

  // 7. Theme persistence
  test('persists dark mode preference across page reloads', async ({ page }) => {
    // App loads in dark mode by default
    await expect(page.locator('[data-theme="dark"]')).toBeVisible()

    // Toggle to light mode
    await page.getByTestId('theme-toggle').click()
    await expect(page.locator('[data-theme="light"]')).toBeVisible()

    // Reload — should still be in light mode
    await page.reload()
    await expect(page.locator('[data-theme="light"]')).toBeVisible()

    // Toggle back to dark mode
    await page.getByTestId('theme-toggle').click()
    await page.reload()
    await expect(page.locator('[data-theme="dark"]')).toBeVisible()
  })

  // 8. Edge case: empty input
  test('does not add a todo for empty or whitespace-only input', async ({ page }) => {
    // Press Enter with no text
    await page.getByTestId('todo-input').press('Enter')
    await expect(page.getByTestId('todo-item')).toHaveCount(0)

    // Try whitespace only
    await page.getByTestId('todo-input').fill('   ')
    await page.getByTestId('add-button').click()
    await expect(page.getByTestId('todo-item')).toHaveCount(0)
  })

  // 9. Edge case: count shows '0 items left' when all completed or list is empty
  test('shows 0 items left when all todos are completed', async ({ page }) => {
    await addTodo(page, 'Only task')

    // Initially 1 item left
    await expect(page.getByTestId('item-count')).toHaveText('1 item left')

    // Complete the task
    await page.getByTestId('todo-checkbox').first().click()
    await expect(page.getByTestId('item-count')).toHaveText('0 items left')
  })

  // ── Screenshots ──────────────────────────────────────────────────────────────
  test('screenshot: dark mode main screen with todos', async ({ page }) => {
    // Ensure dark mode
    const themeData = await page.evaluate(() => localStorage.getItem('darktodo_theme'))
    if (themeData === 'light') {
      await page.getByTestId('theme-toggle').click()
    }

    await addTodo(page, 'Buy groceries')
    await addTodo(page, 'Read a book')
    await addTodo(page, 'Go for a run')
    await addTodo(page, 'Write tests')

    // Complete the first two
    await page.getByTestId('todo-checkbox').nth(0).click()
    await page.getByTestId('todo-checkbox').nth(1).click()

    await captureScreenshot(page, '01-dark-mode-main')
  })

  test('screenshot: light mode main screen', async ({ page }) => {
    await addTodo(page, 'Buy groceries')
    await addTodo(page, 'Read a book')
    await addTodo(page, 'Go for a run')

    // Complete the first one
    await page.getByTestId('todo-checkbox').first().click()

    // Switch to light mode
    await page.getByTestId('theme-toggle').click()
    await expect(page.locator('[data-theme="light"]')).toBeVisible()

    await captureScreenshot(page, '02-light-mode-main')
  })

  test('screenshot: empty state in dark mode', async ({ page }) => {
    // Should already be empty and dark by default
    await expect(page.locator('[data-theme="dark"]')).toBeVisible()
    await expect(page.getByTestId('empty-state')).toBeVisible()
    await captureScreenshot(page, '03-empty-state-dark')
  })
})
