import { useEffect, useRef, useState } from "react";
import { Theme } from "@radix-ui/themes";
import { Link, useLocation } from "wouter";
import { IoIosMenu } from "react-icons/io";
import cn from "classnames";

import styles from "./Layout.module.scss";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Ranker",
    href: "/ranker",
  },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [location] = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

  const onMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDrawerOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <Theme
      className={styles.root}
      id="parent"
      accentColor="crimson"
      grayColor="mauve"
      radius="small"
    >
      <nav className={styles.nav}>
        <img src="/favicon.png" alt="Smash Ranker" />
        <IoIosMenu onClick={onMenuClick} />
      </nav>
      <div
        ref={drawerRef}
        className={cn(styles.drawer, { [styles.open]: isDrawerOpen })}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            className={cn({ [styles.active]: location === item.href })}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <main>{children}</main>
    </Theme>
  );
};
