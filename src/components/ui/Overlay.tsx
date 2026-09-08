import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IconButton } from "./Button";

/* ------------------------------ پورتال و هوک مشترک ------------------------------ */

function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

function useOverlayBehavior(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // فوکوس اولیه داخل پنل برای دسترس‌پذیری
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  return panelRef;
}

function Backdrop({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <button
      type="button"
      className="overlay-backdrop"
      aria-label={label}
      tabIndex={-1}
      onClick={onClose}
    />
  );
}

/* ------------------------------ باتم‌شیت ------------------------------ */

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** باتم‌شیت — الگوی اصلی نمایش پنل در موبایل */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const panelRef = useOverlayBehavior(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <Backdrop onClose={onClose} label="بستن پنل" />
      <div
        ref={panelRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="sheet__handle" aria-hidden />
        <div className="sheet__header">
          <h2 className="sheet__title">{title}</h2>
          <IconButton label="بستن" size="sm" onClick={onClose}>
            <X size={20} aria-hidden />
          </IconButton>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </Portal>
  );
}

/* ------------------------------ مودال ------------------------------ */

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

/** مودال مرکزی — مناسب تأییدها و فرم‌های کوتاه */
export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const panelRef = useOverlayBehavior(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <Backdrop onClose={onClose} label="بستن پنجره" />
      <div
        ref={panelRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="modal__header">
          <div>
            <h2 className="modal__title">{title}</h2>
            {description && <p className="modal__desc">{description}</p>}
          </div>
          <IconButton label="بستن" size="sm" onClick={onClose}>
            <X size={20} aria-hidden />
          </IconButton>
        </div>
        {children && <div className="modal__body">{children}</div>}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </Portal>
  );
}

/* ------------------------------ کشو ------------------------------ */

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** کشوی کناری — در RTL از سمت راست باز می‌شود */
export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const panelRef = useOverlayBehavior(open, onClose);
  if (!open) return null;
  return (
    <Portal>
      <Backdrop onClose={onClose} label="بستن کشو" />
      <div
        ref={panelRef}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="drawer__header">
          <h2 className="drawer__title">{title}</h2>
          <IconButton label="بستن" size="sm" onClick={onClose}>
            <X size={20} aria-hidden />
          </IconButton>
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </Portal>
  );
}

/* ------------------------------ تولتیپ ------------------------------ */

export interface TooltipProps {
  label: string;
  children: ReactNode;
}

/** تولتیپ — فقط برای عناصر دارای فوکوس/هاور استفاده شود */
export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="tip" data-tip={label}>
      {children}
    </span>
  );
}
