import { create } from 'zustand'

const MAX_UNDO_STACK = 50

interface DesignerStore {
  selectedProductId: string | null
  selectedColor: string
  selectedView: 'front' | 'back' | 'left' | 'right'
  activePanel: 'text' | 'clipart' | 'upload' | 'ai' | null
  canvasJson: string | null
  undoStack: string[]
  redoStack: string[]
  isGeneratingAI: boolean

  setProduct: (id: string) => void
  setColor: (color: string) => void
  setView: (view: 'front' | 'back' | 'left' | 'right') => void
  setActivePanel: (panel: 'text' | 'clipart' | 'upload' | 'ai' | null) => void
  /**
   * Call this every time the canvas changes. It pushes the current canvasJson
   * onto the undo stack, clears the redo stack, and sets the new state.
   */
  saveCanvasState: (json: string) => void
  /**
   * Moves one step back in history. Returns the JSON to restore, or null if
   * already at the beginning of the stack.
   */
  undo: () => string | null
  /**
   * Moves one step forward in history. Returns the JSON to restore, or null
   * if there is nothing to redo.
   */
  redo: () => string | null
  setAIGenerating: (val: boolean) => void
  /** Resets all designer state back to initial values (e.g., when starting a new design) */
  reset: () => void
}

const initialState = {
  selectedProductId: null,
  selectedColor: '',
  selectedView: 'front' as const,
  activePanel: 'text' as const,
  canvasJson: null,
  undoStack: [] as string[],
  redoStack: [] as string[],
  isGeneratingAI: false,
}

export const useDesignerStore = create<DesignerStore>((set, get) => ({
  ...initialState,

  setProduct: (id) =>
    set({
      selectedProductId: id,
      // Reset view/canvas whenever the product changes
      selectedView: 'front',
      canvasJson: null,
      undoStack: [],
      redoStack: [],
    }),

  setColor: (color) => set({ selectedColor: color }),

  setView: (view) => set({ selectedView: view }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  saveCanvasState: (json) => {
    const { canvasJson, undoStack } = get()

    // Don't push duplicate states
    if (canvasJson === json) return

    const newUndoStack = canvasJson
      ? [...undoStack, canvasJson].slice(-MAX_UNDO_STACK)
      : undoStack

    set({
      canvasJson: json,
      undoStack: newUndoStack,
      // Clear redo stack whenever a new state is saved
      redoStack: [],
    })
  },

  undo: () => {
    const { undoStack, canvasJson, redoStack } = get()
    if (undoStack.length === 0) return null

    const previous = undoStack[undoStack.length - 1]
    const newUndoStack = undoStack.slice(0, -1)
    const newRedoStack = canvasJson
      ? [canvasJson, ...redoStack]
      : redoStack

    set({
      canvasJson: previous,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    })

    return previous
  },

  redo: () => {
    const { redoStack, canvasJson, undoStack } = get()
    if (redoStack.length === 0) return null

    const next = redoStack[0]
    const newRedoStack = redoStack.slice(1)
    const newUndoStack = canvasJson
      ? [...undoStack, canvasJson].slice(-MAX_UNDO_STACK)
      : undoStack

    set({
      canvasJson: next,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    })

    return next
  },

  setAIGenerating: (val) => set({ isGeneratingAI: val }),

  reset: () => set(initialState),
}))
