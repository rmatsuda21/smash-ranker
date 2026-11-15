import cn from "classnames";

import styles from "./EditorForm.module.scss";

type DivProps = React.ComponentProps<"div">;

// Building blocks shared by the side panel's editor tabs: a scrolling column
// of cards, each holding labelled fields.

export const EditorPanel = ({ className, ...props }: DivProps) => (
  <div className={cn(styles.panel, className)} {...props} />
);

type CardProps = Omit<React.ComponentProps<"section">, "title"> & {
  title?: React.ReactNode;
  /** Dims the card; the controls inside still need their own `disabled`. */
  disabled?: boolean;
  /** Lay the card's children out side by side instead of stacked. */
  horizontal?: boolean;
};

export const EditorCard = ({
  title,
  disabled,
  horizontal,
  className,
  children,
  ...props
}: CardProps) => (
  <section
    className={cn(
      styles.card,
      { [styles.disabled]: disabled, [styles.horizontal]: horizontal },
      className,
    )}
    {...props}
  >
    {title && <h4 className={styles.cardTitle}>{title}</h4>}
    {children}
  </section>
);

export const FieldStack = ({ className, ...props }: DivProps) => (
  <div className={cn(styles.stack, className)} {...props} />
);

export const FieldRow = ({ className, ...props }: DivProps) => (
  <div className={cn(styles.row, className)} {...props} />
);

type FieldGroupProps = DivProps & {
  label: React.ReactNode;
};

// A label above any control that isn't a plain input (dropdown, picker).
export const FieldGroup = ({
  label,
  className,
  children,
  ...props
}: FieldGroupProps) => (
  <div className={cn(styles.field, className)} {...props}>
    <span className={styles.label}>{label}</span>
    {children}
  </div>
);

type FieldProps = Omit<React.ComponentProps<"input">, "prefix"> & {
  /** Visible label. Without one, pass `aria-label`. */
  label?: string;
  /** Icon or short text shown before the value. */
  prefix?: React.ReactNode;
  /** Action shown after the value. */
  trailing?: React.ReactNode;
  /** Bold value, for the field that names the thing being edited. */
  strong?: boolean;
  wrapperClassName?: string;
};

export const Field = ({
  label,
  prefix,
  trailing,
  strong,
  wrapperClassName,
  id,
  ...props
}: FieldProps) => (
  <div className={cn(styles.field, wrapperClassName)}>
    {label && (
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
    )}
    <div className={cn(styles.control, { [styles.strong]: strong })}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <input id={id} {...props} />
      {trailing}
    </div>
  </div>
);
