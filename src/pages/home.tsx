import { Container, Em, Flex, Heading, Text } from "@radix-ui/themes";

import styles from "./home.module.scss";

export const Home = () => {
  return (
    <Container className={styles.root}>
      <Heading as="h1" size="9">
        Welcome 👋
      </Heading>
      <Flex direction="column" gap="2">
        <Text as="p">
          Soon to be page for all of your smash graphic generator tools
        </Text>

        <Text as="p">
          <Em>Check back for updates~</Em>
        </Text>
      </Flex>
    </Container>
  );
};
