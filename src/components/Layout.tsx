import { TabNav, Theme } from "@radix-ui/themes";

import styles from "./styles/Layout.module.scss";
import { Link, useLocation } from "wouter";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [location] = useLocation();

  return (
    <Theme
      className={styles.root}
      id="parent"
      accentColor="sky"
      grayColor="slate"
      radius="small"
    >
      <TabNav.Root>
        <TabNav.Link asChild active={location === "/"}>
          <Link href="/">Home</Link>
        </TabNav.Link>
        <TabNav.Link asChild active={location === "/ranker"}>
          <Link href="/ranker">Ranker</Link>
        </TabNav.Link>{" "}
      </TabNav.Root>
      <main>{children}</main>
    </Theme>
  );
};
