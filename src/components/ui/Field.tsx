import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";
import { formatAmountInput } from "@/lib/fa";

/* ------------------------------ فیلد ------------------------------ */

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

/** قاب استاندارد برای همهٔ ورودی‌ها: برچسب + کنترل + راهنما/خطا */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("field", className)}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {optional && <span className="field__optional">(اختیاری)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="field__error" role="alert">
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 3 }} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------ ورودی متنی ------------------------------ */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, leading, trailing, loading, className, disabled, ...rest },
  ref
) {
  return (
    <div
      className={cn(
        "control",
        invalid && "is-error",
        disabled && "is-disabled",
        className
      )}
    >
      {leading && <span className="control__icon">{leading}</span>}
      <input ref={ref} disabled={disabled} aria-invalid={invalid || undefined} {...rest} />
      {loading && <LoaderCircle size={18} className="spinner control__icon" aria-hidden />}
      {trailing}
    </div>
  );
});

/* ------------------------------ جست‌وجو ------------------------------ */

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  /** کلید ورود (اینتر) برای جست‌وجو */
  onSubmitSearch?: (value: string) => void;
}

/** ورودی جست‌وجو با دکمهٔ پاک‌کردن */
export function SearchInput({
  value,
  onValueChange,
  onSubmitSearch,
  className,
  ...rest
}: SearchInputProps) {
  return (
    <div className={cn("search-input", className)}>
      <div className="control">
        <Search size={20} className="control__icon" aria-hidden />
        <input
          type="text"
          inputMode="search"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmitSearch?.(value);
          }}
          {...rest}
        />
        {value && (
          <IconButton
            label="پاک‌کردن جست‌وجو"
            size="sm"
            className="search-input__clear"
            onClick={() => onValueChange("")}
          >
            <X size={16} aria-hidden />
          </IconButton>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ سلکت ------------------------------ */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ invalid, className, children, ...rest }, ref) {
    return (
      <div className={cn("select-wrap", className)}>
        <select ref={ref} className={cn(invalid && "is-error")} {...rest}>
          {children}
        </select>
        <ChevronDown size={20} className="select-wrap__chevron" aria-hidden />
      </div>
    );
  }
);

/* ------------------------------ تریگر تاریخ ------------------------------ */

export interface DatePickerTriggerProps {
  value?: string;
  placeholder?: string;
  onChange?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
}

/**
 * تریگر انتخاب تاریخ — در فازهای بعد به تقویم شمسی متصل می‌شود.
 * فعلاً فقط ظاهر و رفتار دکمه‌ای استاندارد دارد.
 */
export function DatePickerTrigger({
  value,
  placeholder = "انتخاب تاریخ",
  onChange,
  disabled,
  invalid,
  id,
}: DatePickerTriggerProps) {
  return (
    <button
      type="button"
      id={id}
      className={cn("control date-trigger", invalid && "is-error")}
      onClick={onChange}
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={false}
    >
      <Calendar size={20} className="control__icon" aria-hidden />
      <span
        className={cn(
          "date-trigger__value",
          !value && "date-trigger__placeholder"
        )}
      >
        {value || placeholder}
      </span>
      <ChevronDown size={18} className="control__icon" aria-hidden />
    </button>
  );
}

/* ------------------------------ ورودی مبلغ ------------------------------ */

export interface AmountInputProps {
  /** مقدار قالب‌بندی‌شده (با جداکنندهٔ هزارگان و ارقام فارسی) */
  value: string;
  onValueChange: (formattedValue: string) => void;
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  autoFocus?: boolean;
}

/**
 * ورودی مبلغ — فقط رقم می‌پذیرد و هم‌زمان با تایپ، جداکنندهٔ هزارگان
 * و ارقام فارسی اعمال می‌شود. واحد پول به‌صورت پیش‌فرض تومان است.
 */
export function AmountInput({
  value,
  onValueChange,
  unit = "تومان",
  placeholder = "۰",
  disabled,
  invalid,
  id,
  autoFocus,
}: AmountInputProps) {
  return (
    <div className={cn("amount-input")}>
      <div className={cn("control", invalid && "is-error", disabled && "is-disabled")}>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          dir="rtl"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-invalid={invalid || undefined}
          onChange={(e) => onValueChange(formatAmountInput(e.target.value))}
        />
        <span className="amount-input__unit">{unit}</span>
      </div>
    </div>
  );
}

/* ------------------------------ تکست‌اریا ------------------------------ */

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className, disabled, ...rest }, ref) {
    return (
      <div
        className={cn(
          "textarea-wrap",
        )}
      >
        <div
          className={cn(
            "control",
            invalid && "is-error",
            disabled && "is-disabled",
            className
          )}
        >
          <textarea ref={ref} disabled={disabled} aria-invalid={invalid || undefined} {...rest} />
        </div>
      </div>
    );
  }
);

/* ------------------------------ آیدی خودکار برای فیلدها ------------------------------ */

/** هوک کوچک برای تولید شناسهٔ یکتا بین برچسب و کنترل */
export function useFieldId(provided?: string): string {
  const auto = useId();
  return provided ?? auto;
}

/* حالت انتخاب مقدار جست‌وجو برای استفادهٔ صفحات */
export function useSearchState(initial = "") {
  const [value, setValue] = useState(initial);
  return { value, setValue };
}
