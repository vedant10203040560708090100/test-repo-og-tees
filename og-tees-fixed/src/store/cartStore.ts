import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  sessionId: string
  isOpen: boolean

  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getTotalItems: () => number
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateSessionId(): string {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: generateSessionId(),
      isOpen: false,

      addItem: (itemWithoutId) => {
        set((state) => {
          // If an identical line item exists (same product + color + size + design),
          // increment its quantity rather than creating a duplicate entry.
          const existing = state.items.find(
            (i) =>
              i.product.id === itemWithoutId.product.id &&
              i.color === itemWithoutId.color &&
              i.size === itemWithoutId.size &&
              i.designJson === itemWithoutId.designJson
          )

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === existing.id
                  ? { ...i, quantity: i.quantity + itemWithoutId.quantity }
                  : i
              ),
            }
          }

          const newItem: CartItem = {
            ...itemWithoutId,
            id: generateId(),
          }
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      /** Sum of (unitPrice + printPrice) × quantity for all items */
      getTotal: () =>
        get().items.reduce(
          (sum, i) => sum + (i.unitPrice + i.printPrice) * i.quantity,
          0
        ),

      /** Number of distinct line items in the cart */
      getItemCount: () => get().items.length,

      /** Total number of individual units across all line items */
      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'og-tees-cart',
      // Only persist items and sessionId — do not persist transient UI state like isOpen
      partialize: (state) => ({
        items: state.items,
        sessionId: state.sessionId,
      }),
    }
  )
)
