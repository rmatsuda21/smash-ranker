import cn from "classnames";

import styles from "./Slider.module.scss";

type SliderSize = "sm" | "md" | "lg";

type Props = Omit<
  React.ComponentProps<"input">,
  "type" | "onChange" | "size"
> & {
  label?: string | React.ReactNode;
  labelInLine?: boolean;
  size?: SliderSize;
  onValueChange?: (value: number) => void;
};

const getFillPercent = (
  value: string | number | readonly string[] | undefined,
  min: string | number,
  max: string | number
) => {
  if (!value) return "0%";
  const valueNum = Number(value);
  const minNum = Number(min);
  const maxNum = Number(max);
  const percent = ((valueNum - minNum) / (maxNum - minNum)) * 100;
  return `${percent}%`;
};

export const Slider = ({
  className,
  label,
  labelInLine = false,
  size = "md",
  onValueChange,
  min = 0,
  max = 100,
  value,
  ...props
}: Props) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange?.(Number(event.target.value));
  };

  const trackStyle = {
    "--fill-percent": getFillPercent(value, min, max),
  } as React.CSSProperties;

  return (
    <div
      className={cn(styles.wrapper, styles[size], className, {
        [styles.labelInLine]: labelInLine,
      })}
    >
      {label && <label htmlFor={props.id}>{label}</label>}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        style={trackStyle}
        {...props}
      />
    </div>
  );
};
