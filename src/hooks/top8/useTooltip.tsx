import { useRef, useState } from "react";
import cn from "classnames";

const TOOLTIP_DELAY = 200;

type Options = {
  tooltip: string;
  delay?: number;
};

export const useTooltip = ({ tooltip, delay = TOOLTIP_DELAY }: Options) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handleMouseEnter = () => {
    if (tooltip) {
      tooltipTimeout.current = setTimeout(() => {
        setShowTooltip(true);
      }, delay);
    }
  };

  const handleMouseLeave = () => {
    if (tooltip) {
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
      setShowTooltip(false);
    }
  };

  const Tooltip = ({ className }: { className?: string }) => {
    return (
      <div className={cn("tooltip", className, { show: showTooltip })}>
        {tooltip}
      </div>
    );
  };

  return { Tooltip, handleMouseEnter, handleMouseLeave };
};
