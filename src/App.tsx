import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

type Filter = 'all' | 'active' | 'completed'
type Theme = 'dark' | 'light'

// ─── localStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEYS = {
  items: 'darktodo_items',
  theme: 'darktodo_theme',
} as const

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.items)
    if (!raw) return []
    return JSON.parse(raw) as Todo[]
  } catch (err) {
    console.error('Failed to load todos from localStorage:', err)
    return []
  }
}

function saveTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(todos))
  } catch (err) {
    console.error('Failed to save todos to localStorage:', err)
  }
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.theme)
    if (raw === 'light' || raw === 'dark') return raw
    return 'dark'
  } catch (err) {
    console.error('Failed to load theme from localStorage:', err)
    return 'dark'
  }
}

function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEYS.theme, theme)
  } catch (err) {
    console.error('Failed to save theme to localStorage:', err)
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [filter, setFilter] = useState<Filter>('all')
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState(false)

  const isDark = theme === 'dark'

  // Persist todos whenever they change
  useEffect(() => {
    saveTodos(todos)
  }, [todos])

  // Persist theme whenever it changes
  useEffect(() => {
    saveTheme(theme)
  }, [theme])

  // ── Add todo ──────────────────────────────────────────────────────────────
  const addTodo = useCallback(() => {
    const text = inputValue.trim()
    if (!text) {
      setInputError(true)
      setTimeout(() => setInputError(false), 600)
      setInputValue('')
      return
    }
    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTodos(prev => [...prev, newTodo])
    setInputValue('')
    setInputError(false)
  }, [inputValue])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') addTodo()
  }

  // ── Toggle complete ───────────────────────────────────────────────────────
  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }, [])

  // ── Delete todo ───────────────────────────────────────────────────────────
  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Clear completed ───────────────────────────────────────────────────────
  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed))
  }, [])

  // ── Toggle theme ──────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const incompleteCount = todos.filter(t => !t.completed).length
  const hasCompleted = todos.some(t => t.completed)

  // ─── Theme-aware class helpers ─────────────────────────────────────────────
  const bg = isDark ? 'bg-[#1a1a2e]' : 'bg-[#f5f5f5]'
  const cardBg = isDark ? 'bg-[#16213e]' : 'bg-white'
  const titleColor = isDark ? 'text-[#e94560]' : 'text-[#e94560]'
  const textColor = isDark ? 'text-slate-200' : 'text-slate-800'
  const subTextColor = isDark ? 'text-slate-400' : 'text-slate-500'
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200'
  const inputBg = isDark ? 'bg-[#0f3460] text-slate-100 placeholder-slate-500' : 'bg-slate-100 text-slate-800 placeholder-slate-400'
  const accentHover = isDark ? 'hover:text-[#e94560]' : 'hover:text-[#e94560]'
  const iconBtnColor = isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${bg} flex flex-col items-center py-12 px-4`}
      data-theme={theme}
    >
      {/* ── Header ── */}
      <header className="w-full max-w-lg flex items-center justify-between mb-8">
        <h1 className={`text-4xl font-bold tracking-widest uppercase ${titleColor}`}>
          DarkTodo
        </h1>
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          data-testid="theme-toggle"
          className={`p-2 rounded-full transition-colors duration-200 ${iconBtnColor} ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-slate-100'} shadow`}
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      {/* ── Card ── */}
      <main className={`w-full max-w-lg rounded-xl shadow-2xl overflow-hidden ${cardBg}`}>

        {/* ── Input ── */}
        <div className={`flex items-center border-b ${borderColor}`}>
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            aria-label="New todo input"
            data-testid="todo-input"
            className={`flex-1 px-5 py-4 text-base outline-none transition-colors duration-200 ${inputBg} ${inputError ? 'placeholder-red-400 ring-2 ring-inset ring-red-500' : ''}`}
          />
          <button
            onClick={addTodo}
            aria-label="Add todo"
            data-testid="add-button"
            className="px-5 py-4 text-[#e94560] font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            Add
          </button>
        </div>

        {/* ── Todo List ── */}
        <ul data-testid="todo-list">
          {filteredTodos.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-16 gap-3" data-testid="empty-state">
              <span className="text-4xl">✨</span>
              <p className={`text-sm ${subTextColor}`}>
                {todos.length === 0
                  ? 'No todos yet — add one above!'
                  : filter === 'active'
                  ? 'No active todos!'
                  : 'No completed todos!'}
              </p>
            </li>
          ) : (
            filteredTodos.map((todo, idx) => (
              <li
                key={todo.id}
                data-testid="todo-item"
                className={`flex items-center gap-4 px-5 py-4 transition-colors duration-150 ${isDark ? 'hover:bg-[#0f3460]' : 'hover:bg-slate-50'} ${idx < filteredTodos.length - 1 ? `border-b ${borderColor}` : ''}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  data-testid="todo-checkbox"
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200
                    ${todo.completed
                      ? 'border-[#e94560] bg-[#e94560]'
                      : isDark ? 'border-slate-500 hover:border-[#e94560]' : 'border-slate-300 hover:border-[#e94560]'
                    }`}
                >
                  {todo.completed && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Text */}
                <span
                  className={`flex-1 text-sm leading-relaxed transition-colors duration-200 ${
                    todo.completed
                      ? `line-through ${subTextColor}`
                      : textColor
                  }`}
                  data-testid="todo-text"
                >
                  {todo.text}
                </span>

                {/* Delete */}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  aria-label="Delete todo"
                  data-testid="delete-button"
                  className={`flex-shrink-0 transition-colors duration-150 ${subTextColor} hover:text-[#e94560]`}
                >
                  <TrashIcon />
                </button>
              </li>
            ))
          )}
        </ul>

        {/* ── Footer ── */}
        {todos.length > 0 && (
          <div className={`flex items-center justify-between px-5 py-3 text-xs border-t ${borderColor} ${subTextColor}`}>
            {/* Count */}
            <span data-testid="item-count">
              {incompleteCount} {incompleteCount === 1 ? 'item' : 'items'} left
            </span>

            {/* Filters */}
            <div className="flex gap-1" role="tablist" aria-label="Filter todos">
              {(['all', 'active', 'completed'] as Filter[]).map(f => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  data-testid={`filter-${f}`}
                  className={`px-2 py-1 rounded capitalize transition-colors duration-150 ${
                    filter === f
                      ? 'text-[#e94560] border border-[#e94560]'
                      : `${accentHover} border border-transparent`
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Clear Completed */}
            <button
              onClick={clearCompleted}
              data-testid="clear-completed"
              disabled={!hasCompleted}
              className={`transition-colors duration-150 ${hasCompleted ? `${accentHover} cursor-pointer` : 'opacity-30 cursor-not-allowed'}`}
            >
              Clear Completed
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
