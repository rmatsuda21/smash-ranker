import cn from "classnames";

import styles from "./RadioGroup.module.scss";

export type RadioGroupOption<T extends string> = {
  value: T;
  label: React.ReactNode;
};

type Props<T extends string> = {
  options: RadioGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  name?: string;
};

export const RadioGroup = <T extends string>({
  options,
  value,
  onChange,
  className,
  name,
}: Props<T>) => {
  return (
    <div className={cn(styles.radioGroup, className)} role="radiogroup">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            name={name}
            className={cn(styles.option, { [styles.active]: isActive })}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
