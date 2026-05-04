import {
  type ComponentProps,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import cn from "classnames";

import styles from "./Card.module.scss";

export type CardVariant = "default" | "interactive";

type CardOwnProps<E extends ElementType> = {
  as?: E;
  variant?: CardVariant;
  children?: ReactNode;
};

type CardProps<E extends ElementType> = CardOwnProps<E> &
  HTMLAttributes<HTMLElement> &
  Omit<
    ComponentProps<E>,
    keyof CardOwnProps<E> | keyof HTMLAttributes<HTMLElement>
  >;

export const Card = <E extends ElementType = "div">({
  as,
  variant = "default",
  className,
  children,
  ...rest
}: CardProps<E>) => {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      className={cn(styles.card, styles[variant], className)}
      {...rest}
    >
      {children}
    </Component>
  );
};
