import styles from "./home.module.scss";

export const Home = () => {
  return (
    <div className={styles.root}>
      <h1>Welcome 👋</h1>
      <div className={styles.content}>
        <p>Soon to be page for all of your smash graphic generator tools</p>

        <p>
          <em>Check back for updates~</em>
        </p>
      </div>
    </div>
  );
};
