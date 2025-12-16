import { useEffect, useRef, useCallback } from "react";

type TooltipApi = {
  show: (content: string) => void;
  hide: () => void;
};

export const useTooltip = (
  listenerRef?: React.RefObject<HTMLElement | null>
): [React.RefObject<HTMLDivElement | null>, TooltipApi] => {
  const tooltipRef = useRef<HTMLDivElement>(null);

  const show = useCallback((content: string) => {
    if (!tooltipRef.current) return;

    tooltipRef.current.style.display = "block";
    tooltipRef.current.innerText = content;
  }, []);

  const hide = useCallback(() => {
    if (!tooltipRef.current) return;

    tooltipRef.current.style.display = "none";
    tooltipRef.current.innerText = "";
  }, []);

  useEffect(() => {
    const listener = listenerRef?.current;

    const handleMouseMove = (event: MouseEvent) => {
      if (!tooltipRef.current) return;

      tooltipRef.current.style.top = `${event.clientY + 10}px`;
      tooltipRef.current.style.left = `${event.clientX + 10}px`;
    };

    if (!listener) {
      window.addEventListener("mousemove", handleMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
      };
    }

    listener.addEventListener("mousemove", handleMouseMove);
    return () => {
      listener.removeEventListener("mousemove", handleMouseMove);
    };
  }, [listenerRef]);

  return [tooltipRef, { show, hide }];
};
