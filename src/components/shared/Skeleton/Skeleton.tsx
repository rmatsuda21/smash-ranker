import cn from "classnames";

import styles from "./Skeleton.module.scss";

type Props = React.ComponentProps<"div">;

export const Skeleton = ({ className, ...props }: Props) => {
  return <div className={cn(styles.skeleton, className)} {...props} />;
};
