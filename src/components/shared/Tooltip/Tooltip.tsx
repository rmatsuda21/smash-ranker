import cn from "classnames";

import styles from "./Tooltip.module.scss";

type Props = {
  className?: string;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
};

export const Tooltip = ({ className, tooltipRef }: Props) => {
  return <div ref={tooltipRef} className={cn(styles.tooltip, className)} />;
};
