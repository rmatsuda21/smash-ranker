import {
  PropsWithChildren,
  ReactElement,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ElementFilterConfig } from "@/types/top8/Design";
import { FilteredGroup } from "@/components/top8/Canvas/FilteredGroup";

type Props = PropsWithChildren<
  React.ComponentProps<typeof FilteredGroup> & {
    filtersConfig?: ElementFilterConfig[];
  }
>;

export const FilteredElement = ({ children, ...rest }: Props) => {
  const [contentVersion, setContentVersion] = useState(0);

  const invalidate = useCallback(() => {
    setContentVersion((v) => v + 1);
  }, []);

  const childOnReadyRef = useRef<undefined | (() => void)>(undefined);
  const prevChildPropsRef = useRef<{
    text?: string;
    fontSize?: number;
    fill?: string;
  }>({});

  useEffect(() => {
    const child = children as ReactElement<any>;

    if (!child) {
      childOnReadyRef.current = undefined;
      return;
    }

    childOnReadyRef.current = child.props?.onReady;
  }, [children]);

  const childText = (children as ReactElement<any>).props?.text;
  const childFontSize = (children as ReactElement<any>).props?.fontSize;
  const childFill = (children as ReactElement<any>).props?.fill;

  useEffect(() => {
    if (!isValidElement(children)) return;

    const prevProps = prevChildPropsRef.current;

    const hasChanged =
      childText !== prevProps.text ||
      childFontSize !== prevProps.fontSize ||
      childFill !== prevProps.fill;

    prevChildPropsRef.current = {
      text: childText,
      fontSize: childFontSize,
      fill: childFill,
    };

    if (hasChanged) {
      invalidate();
    }
  }, [children, childText, childFontSize, childFill, invalidate]);

  const handleReady = useCallback(() => {
    childOnReadyRef.current?.();
    invalidate();
  }, [invalidate]);

  const maybeAugmentedChild = (() => {
    if (!isValidElement(children)) return children;

    const child = children as ReactElement<any>;
    return cloneElement(child, {
      onReady: handleReady,
    });
  })();

  return (
    <FilteredGroup {...rest} invalidateCacheKey={contentVersion}>
      {maybeAugmentedChild}
    </FilteredGroup>
  );
};
