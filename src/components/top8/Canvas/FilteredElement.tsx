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
  const invalidateTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const invalidate = useCallback(() => {
    clearTimeout(invalidateTimeoutRef.current);
    invalidateTimeoutRef.current = setTimeout(() => {
      setContentVersion((v) => v + 1);
    }, 50);
  }, []);

  useEffect(() => {
    return () => clearTimeout(invalidateTimeoutRef.current);
  }, []);

  const childOnReadyRef = useRef<undefined | (() => void)>(undefined);
  const prevChildPropsRef = useRef<{
    text?: string;
    fontSize?: number;
    fill?: string;
    fontFamily?: string;
    fontStyle?: string;
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
  const childFontFamily = (children as ReactElement<any>).props?.fontFamily;
  const childFontStyle = (children as ReactElement<any>).props?.fontStyle;

  useEffect(() => {
    if (!isValidElement(children)) return;

    const prevProps = prevChildPropsRef.current;

    const hasChanged =
      childText !== prevProps.text ||
      childFontSize !== prevProps.fontSize ||
      childFill !== prevProps.fill ||
      childFontFamily !== prevProps.fontFamily ||
      childFontStyle !== prevProps.fontStyle;

    prevChildPropsRef.current = {
      text: childText,
      fontSize: childFontSize,
      fill: childFill,
      fontFamily: childFontFamily,
      fontStyle: childFontStyle,
    };

    if (hasChanged) {
      invalidate();
    }
  }, [
    children,
    childText,
    childFontSize,
    childFill,
    childFontFamily,
    childFontStyle,
    invalidate,
  ]);

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
