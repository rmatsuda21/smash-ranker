import { type ReactNode, useId } from "react";
import cn from "classnames";

import styles from "./Checkbox.module.scss";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  id?: string;
}

export const Checkbox = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
  className,
  id,
}: CheckboxProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(styles.wrapper, styles[size], disabled && styles.disabled, className)}
    >
      <input
        id={inputId}
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        disabled={disabled}
      />
      {label !== undefined && <span className={styles.label}>{label}</span>}
    </label>
  );
};
