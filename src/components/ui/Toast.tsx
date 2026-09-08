import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "error" | "warning" | "info" | "neutral";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** میلی‌ثانیه — پیش‌فرض ۴۰۰۰ */
  duration?: number;
}

interface ToastRecord extends Required<Pick<ToastOptions, "title" | "variant">> {
  id: number;
  description?: string;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={20} aria-hidden />,
  error: <AlertCircle size={20} aria-hidden />,
  warning: <AlertTriangle size={20} aria-hidden />,
  info: <Info size={20} aria-hidden />,
  neutral: <Bell size={20} aria-hidden />,
};

/** فراهم‌کنندهٔ توست — سراسر اپ */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = "neutral", duration = 4000 }: ToastOptions) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, title, description, variant }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="toast-region"
        role="region"
        aria-label="اعلان‌ها"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={cn("toast", `toast--${toast.variant}`)}>
            <span className="toast__icon">{VARIANT_ICON[toast.variant]}</span>
            <div className="toast__body">
              <p className="toast__title">{toast.title}</p>
              {toast.description && (
                <p className="toast__desc">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="بستن اعلان"
              onClick={() => dismiss(toast.id)}
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast باید داخل ToastProvider استفاده شود");
  return ctx;
}
