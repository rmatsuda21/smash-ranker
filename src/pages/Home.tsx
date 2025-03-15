import { Container } from "@radix-ui/themes";

import styles from "./Home.module.scss";

export const Home = () => {
  return (
    <Container className={styles.root}>
      <h1>Home</h1>
      <p>Welcome to the home page!</p>
    </Container>
  );
};
