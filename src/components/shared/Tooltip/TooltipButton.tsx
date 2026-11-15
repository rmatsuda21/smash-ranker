import { useTooltip } from "@/hooks/useTooltip";

type Props = React.ComponentProps<"button"> & {
  tooltip: string;
  /**
   * The tooltip is the button's name (icon-only buttons): it becomes the
   * `aria-label` instead of an extra description.
   */
  tooltipIsLabel?: boolean;
};

/** A plain `<button>` with an accessible tooltip in place of `title`. */
export const TooltipButton = ({
  tooltip: content,
  tooltipIsLabel = false,
  children,
  ...props
}: Props) => {
  const { triggerProps, tooltip } = useTooltip({
    content,
    describe: !tooltipIsLabel,
  });

  return (
    <>
      <button
        type="button"
        aria-label={tooltipIsLabel ? content : undefined}
        {...props}
        {...triggerProps}
      >
        {children}
      </button>
      {tooltip}
    </>
  );
};
