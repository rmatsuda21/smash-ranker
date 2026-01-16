import { useRef, useState, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const DEFAULT_DELAY = 200;

type Options = {
  tooltip: string;
  delay?: number;
};

type Position = {
  top: number;
  left: number;
};

export const useTooltip = ({ tooltip, delay = DEFAULT_DELAY }: Options) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [position, setPosition] = useState<Position>({
    top: 0,
    left: 0,
  });
  const tooltipTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    setPosition({
      top: rect.top - tooltipRect.height - 4,
      left: rect.left + rect.width / 2,
    });
    setIsPositioned(true);
  }, []);

  useLayoutEffect(() => {
    if (showTooltip && tooltipRef.current) {
      requestAnimationFrame(() => {
        updatePosition();
      });
    }
  }, [showTooltip, updatePosition]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (tooltip) {
        triggerRef.current = e.currentTarget;
        tooltipTimeout.current = setTimeout(() => {
          setShowTooltip(true);
        }, delay);
      }
    },
    [tooltip, delay]
  );

  const handleMouseLeave = useCallback(() => {
    if (tooltip) {
      if (tooltipTimeout.current) {
        clearTimeout(tooltipTimeout.current);
      }
      setShowTooltip(false);
      setIsPositioned(false);
      triggerRef.current = null;
    }
  }, [tooltip]);

  const Tooltip = ({ className }: { className?: string }) => {
    if (!showTooltip || !tooltip) return null;

    const tooltipElement = (
      <div
        ref={tooltipRef}
        className={className}
        style={{
          position: "fixed",
          zIndex: 10000,
          top: position.top,
          left: position.left,
          transform: "translateX(-50%)",
          pointerEvents: "none",
          opacity: isPositioned ? 1 : 0,
        }}
      >
        {tooltip}
      </div>
    );

    return createPortal(tooltipElement, document.body);
  };

  return { Tooltip, handleMouseEnter, handleMouseLeave };
};
