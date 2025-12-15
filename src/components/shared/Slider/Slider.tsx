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
  value: number | undefined,
  min: number,
  max: number
) => {
  if (!value) return 0;

  const minNum = Number(min);
  const maxNum = Number(max);
  const valueNum = Number(value ?? minNum);
  return ((valueNum - minNum) / (maxNum - minNum)) * 100;
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
    "--fill-percent": `${getFillPercent(
      Number(value),
      Number(min),
      Number(max)
    )}%`,
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
