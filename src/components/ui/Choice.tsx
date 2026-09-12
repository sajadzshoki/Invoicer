import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  desc?: string;
}

/** چک‌باکس با برچسب و توضیح اختیاری */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, desc, className, id, disabled, ...rest }, ref) {
    return (
      <label className={cn("check", className)}>
        <input
          ref={ref}
          type="checkbox"
          id={id}
          disabled={disabled}
          {...rest}
        />
        <span className="check__box" aria-hidden>
          <Check size={15} strokeWidth={3.5} />
        </span>
        <span className="check__label">
          {label}
          {desc && <span className="check__desc">{desc}</span>}
        </span>
      </label>
    );
  }
);

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  desc?: string;
}

/** رادیو باتن با برچسب */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, desc, className, id, disabled, ...rest },
  ref
) {
  return (
    <label className={cn("check radio", className)}>
      <input ref={ref} type="radio" id={id} disabled={disabled} {...rest} />
      <span className="check__box" aria-hidden />
      <span className="check__label">
        {label}
        {desc && <span className="check__desc">{desc}</span>}
      </span>
    </label>
  );
});

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

/** سوییچ روشن/خاموش */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className, id, disabled, checked, ...rest },
  ref
) {
  return (
    <label className={cn("switch", className)}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        id={id}
        disabled={disabled}
        checked={checked}
        aria-checked={checked}
        {...rest}
      />
      <span className="switch__track" aria-hidden>
        <span className="switch__knob" />
      </span>
      <span className="switch__label">{label}</span>
    </label>
  );
});
