import { Link } from "wouter";

import { Button } from "@/components/shared/Button/Button";

import styles from "./home.module.scss";

export const Home = () => {
  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h1>Welcome 👋</h1>
        <p>Soon to be page for all of your smash graphic generator tools!</p>
      </div>

      <div className={styles.tools}>
        <h2>Tools</h2>
        <Link to="/ranker">
          <Button>
            <img src="/favicon.svg" alt="Ranker" /> Ranker
          </Button>
        </Link>
      </div>
    </div>
  );
};
