import cn from "classnames";

import styles from "./Input.module.scss";

type Props = React.ComponentProps<"input"> & {
  label?: string | React.ReactNode;
  labelInLine?: boolean;
  size?: number;
};

export const Input = ({
  className,
  label,
  labelInLine = false,
  size = 16,
  ...props
}: Props) => {
  const inputStyle = {
    "--size": size,
  } as React.CSSProperties;

  return (
    <div
      className={cn(styles.wrapper, className, {
        [styles.labelInLine]: labelInLine,
      })}
      style={inputStyle}
    >
      {label && <label htmlFor={props.id}>{label}</label>}
      <input {...props} />
    </div>
  );
};
