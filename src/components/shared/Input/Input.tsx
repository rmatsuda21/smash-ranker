import cn from "classnames";

import styles from "./Input.module.scss";

type Props = React.ComponentProps<"input"> & {
  label?: string;
};

export const Input = ({ className, label, ...props }: Props) => {
  return (
    <div className={cn(styles.wrapper, className)}>
      {label && <label htmlFor={props.id}>{label}</label>}
      <input {...props} />
    </div>
  );
};
