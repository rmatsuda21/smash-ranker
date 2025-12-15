import cn from "classnames";

import styles from "./Input.module.scss";

type Props = React.ComponentProps<"input"> & {
  label?: string | React.ReactNode;
  labelInLine?: boolean;
};

export const Input = ({
  className,
  label,
  labelInLine = false,
  ...props
}: Props) => {
  return (
    <div
      className={cn(styles.wrapper, className, {
        [styles.labelInLine]: labelInLine,
      })}
    >
      {label && <label htmlFor={props.id}>{label}</label>}
      <input {...props} />
    </div>
  );
};
