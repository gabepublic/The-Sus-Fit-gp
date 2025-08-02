import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from './use-toast';

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('useToast Hook', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    // Reset the memory state by dispatching a clear action
    // Don't try to access the hook result here as it may not be initialized
  });

  afterEach(() => {
    // Clean up any remaining toasts
    act(() => {
      const { result } = renderHook(() => useToast());
      if (result.current && result.current.dismiss) {
        result.current.dismiss();
      }
    });
  });

  describe('useToast', () => {
    it('returns initial state with empty toasts', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('adds a toast when toast function is called', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        title: 'Test Toast',
        description: 'Test Description',
        open: true,
      });
    });

    it('limits toasts to TOAST_LIMIT', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        // Add more toasts than the limit (1)
        result.current.toast({ title: 'First Toast' });
        result.current.toast({ title: 'Second Toast' });
        result.current.toast({ title: 'Third Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Third Toast');
    });

    it('dismisses a specific toast', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        const toastResult = result.current.toast({ title: 'Test Toast' });
        toastId = toastResult.id;
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('dismisses all toasts when no toastId provided', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'First Toast' });
        result.current.toast({ title: 'Second Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('removes toast after timeout', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);

      // Fast-forward time to trigger removal
      act(() => {
        jest.advanceTimersByTime(1000000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('updates toast when update function is called', () => {
      const { result } = renderHook(() => useToast());

      let toastResult: ReturnType<typeof result.current.toast>;
      act(() => {
        toastResult = result.current.toast({ title: 'Original Title' });
      });

      act(() => {
        toastResult.update({ title: 'Updated Title' });
      });

      expect(result.current.toasts[0].title).toBe('Updated Title');
    });

    it('dismisses toast when onOpenChange is called with false', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });

      const toast = result.current.toasts[0];
      act(() => {
        toast.onOpenChange?.(false);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('toast function', () => {
    it('returns toast object with id, dismiss, and update functions', () => {
      const toastResult = toast({ title: 'Test Toast' });

      expect(toastResult).toHaveProperty('id');
      expect(typeof toastResult.dismiss).toBe('function');
      expect(typeof toastResult.update).toBe('function');
    });

    it('generates unique IDs for different toasts', () => {
      const toast1 = toast({ title: 'First Toast' });
      const toast2 = toast({ title: 'Second Toast' });

      expect(toast1.id).not.toBe(toast2.id);
    });
  });

  describe('reducer', () => {
    const initialState = { toasts: [] };

    it('handles ADD_TOAST action', () => {
      const toast = {
        id: '1',
        title: 'Test Toast',
        open: true,
      };

      const action = { type: 'ADD_TOAST' as const, toast };
      const newState = reducer(initialState, action);

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(toast);
    });

    it('handles UPDATE_TOAST action', () => {
      const existingToast = { id: '1', title: 'Original', open: true };
      const state = { toasts: [existingToast] };

      const action = {
        type: 'UPDATE_TOAST' as const,
        toast: { id: '1', title: 'Updated' },
      };

      const newState = reducer(state, action);

      expect(newState.toasts[0].title).toBe('Updated');
      expect(newState.toasts[0].open).toBe(true); // Should preserve existing properties
    });

    it('handles DISMISS_TOAST action with specific toastId', () => {
      const toast = { id: '1', title: 'Test Toast', open: true };
      const state = { toasts: [toast] };

      const action = { type: 'DISMISS_TOAST' as const, toastId: '1' };
      const newState = reducer(state, action);

      expect(newState.toasts[0].open).toBe(false);
    });

    it('handles DISMISS_TOAST action without toastId', () => {
      const toast1 = { id: '1', title: 'First Toast', open: true };
      const toast2 = { id: '2', title: 'Second Toast', open: true };
      const state = { toasts: [toast1, toast2] };

      const action = { type: 'DISMISS_TOAST' as const };
      const newState = reducer(state, action);

      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(false);
    });

    it('handles REMOVE_TOAST action with specific toastId', () => {
      const toast1 = { id: '1', title: 'First Toast', open: true };
      const toast2 = { id: '2', title: 'Second Toast', open: true };
      const state = { toasts: [toast1, toast2] };

      const action = { type: 'REMOVE_TOAST' as const, toastId: '1' };
      const newState = reducer(state, action);

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('2');
    });

    it('handles REMOVE_TOAST action without toastId', () => {
      const toast1 = { id: '1', title: 'First Toast', open: true };
      const toast2 = { id: '2', title: 'Second Toast', open: true };
      const state = { toasts: [toast1, toast2] };

      const action = { type: 'REMOVE_TOAST' as const };
      const newState = reducer(state, action);

      expect(newState.toasts).toHaveLength(0);
    });

    it('limits toasts when adding more than TOAST_LIMIT', () => {
      const toast1 = { id: '1', title: 'First Toast', open: true };
      const toast2 = { id: '2', title: 'Second Toast', open: true };
      const state = { toasts: [toast1, toast2] };

      const newToast = { id: '3', title: 'Third Toast', open: true };
      const action = { type: 'ADD_TOAST' as const, toast: newToast };
      const newState = reducer(state, action);

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('3');
    });
  });
}); 