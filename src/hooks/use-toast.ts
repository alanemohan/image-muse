import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/* ---------------------------------- */
/* Config                             */
/* ---------------------------------- */

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000; // 5s (safe + predictable)

/* ---------------------------------- */
/* Types                              */
/* ---------------------------------- */

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type State = {
  toasts: ToasterToast[];
};

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

/* ---------------------------------- */
/* Utils                              */
/* ---------------------------------- */

const genId = () => crypto.randomUUID();

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const scheduleRemove = (id: string) => {
  if (toastTimeouts.has(id)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(id);
    dispatch({ type: "REMOVE_TOAST", toastId: id });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(id, timeout);
};

/* ---------------------------------- */
/* Reducer                            */
/* ---------------------------------- */

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST":
      return {
        toasts: state.toasts.map((t) =>
          !action.toastId || t.id === action.toastId
            ? { ...t, open: false }
            : t
        ),
      };

    case "REMOVE_TOAST":
      return {
        toasts: action.toastId
          ? state.toasts.filter((t) => t.id !== action.toastId)
          : [],
      };

    default:
      return state;
  }
};

/* ---------------------------------- */
/* Store                              */
/* ---------------------------------- */

let memoryState: State = { toasts: [] };
const listeners = new Set<(state: State) => void>();

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);

  if (action.type === "DISMISS_TOAST") {
    const ids = action.toastId
      ? [action.toastId]
      : memoryState.toasts.map((t) => t.id);

    ids.forEach(scheduleRemove);
  }

  listeners.forEach((listener) => listener(memoryState));
}

/* ---------------------------------- */
/* API                                */
/* ---------------------------------- */

type ToastInput = Omit<ToasterToast, "id">;

function toast(props: ToastInput) {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id });
      },
    },
  });

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    update: (props: Partial<ToasterToast>) =>
      dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } }),
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { toast, useToast };
