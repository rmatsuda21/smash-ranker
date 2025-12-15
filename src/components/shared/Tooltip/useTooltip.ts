import { useEffect, useRef, useCallback } from "react";

type TooltipApi = {
  show: (content: string) => void;
  hide: () => void;
};

export const useTooltip = (): [
  React.RefObject<HTMLDivElement | null>,
  TooltipApi
] => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const show = useCallback((content: string) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = "block";
      tooltipRef.current.innerText = content;
    }
  }, []);

  const hide = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = "none";
      tooltipRef.current.innerText = "";
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (tooltipRef.current) {
        tooltipRef.current.style.top = `${event.clientY + 10}px`;
        tooltipRef.current.style.left = `${event.clientX + 10}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return [tooltipRef, { show, hide }];
};
