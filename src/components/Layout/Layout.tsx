import { TabNav, Theme } from "@radix-ui/themes";
import { Link, useLocation } from "wouter";

import styles from "./Layout.module.scss";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [location] = useLocation();

  return (
    <Theme
      className={styles.root}
      id="parent"
      accentColor="crimson"
      grayColor="mauve"
      radius="small"
    >
      <div className={styles.nav}>
        <TabNav.Root size="2">
          <TabNav.Link asChild active={location === "/"}>
            <Link href="/">Home</Link>
          </TabNav.Link>
          <TabNav.Link asChild active={location === "/ranker"}>
            <Link href="/ranker">Ranker</Link>
          </TabNav.Link>
        </TabNav.Root>
      </div>
      <main>{children}</main>
    </Theme>
  );
};
