import {
  PropsWithChildren,
  ReactElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ElementFilterConfig } from "@/types/top8/Design";
import { FilteredGroup } from "@/components/top8/Canvas/FilteredGroup";
import { AssetLoadBoundary } from "@/components/top8/Canvas/AssetLoadBoundary";

type Props = PropsWithChildren<
  React.ComponentProps<typeof FilteredGroup> & {
    filtersConfig?: ElementFilterConfig[];
  }
>;

export const FilteredElement = ({ children, ...rest }: Props) => {
  const [contentVersion, setContentVersion] = useState(0);
  const invalidateTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  const invalidate = useCallback(() => {
    clearTimeout(invalidateTimeoutRef.current);
    invalidateTimeoutRef.current = setTimeout(() => {
      setContentVersion((v) => v + 1);
    }, 50);
  }, []);

  useEffect(() => {
    return () => clearTimeout(invalidateTimeoutRef.current);
  }, []);

  const prevChildPropsRef = useRef<{
    text?: string;
    fontSize?: number;
    fill?: string;
    fontFamily?: string;
    fontStyle?: string;
  }>({});

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

  return (
    <FilteredGroup {...rest} invalidateCacheKey={contentVersion}>
      {/* An image that finishes loading changes what the cache holds. */}
      <AssetLoadBoundary onAssetReady={invalidate}>
        {children}
      </AssetLoadBoundary>
    </FilteredGroup>
  );
};
