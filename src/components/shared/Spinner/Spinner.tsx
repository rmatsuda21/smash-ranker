import styles from "./Spinner.module.scss";

type Props = {
  className?: string;
  size?: number;
};

export const Spinner = ({ className, size = 50 }: Props) => {
  const spinnerStyle = {
    "--spinner-size": `${size}px`,
  } as React.CSSProperties;

  return (
    <div className={className}>
      <div className={styles.spinner} style={spinnerStyle}>
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
        <div className={styles.bar} />
      </div>
    </div>
  );
};
