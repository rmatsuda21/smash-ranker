import { useEffect, useMemo, useRef, useState } from "react";
import { Theme } from "@radix-ui/themes";
import { Link, useLocation } from "wouter";
import { IoIosMenu } from "react-icons/io";
import cn from "classnames";

import styles from "./Layout.module.scss";
import { MdClose } from "react-icons/md";

const NAV_ITEMS = [
  {
    siteLabel: "",
    label: "Home",
    href: "/",
  },
  {
    siteLabel: "Ranker",
    label: "Ranker",
    href: "/ranker",
  },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [location] = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

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

  const label = useMemo(() => {
    return NAV_ITEMS.find((item) => item.href === location)?.siteLabel ?? "";
  }, [location]);

  return (
    <Theme
      className={styles.root}
      id="parent"
      accentColor="crimson"
      grayColor="mauve"
      radius="small"
    >
      <nav className={styles.nav}>
        <img src="/favicon.svg" alt="Smash Ranker" />
        <h1>{label}</h1>
        <IoIosMenu className={styles.icon} onClick={onMenuClick} />
      </nav>
      <div
        ref={drawerRef}
        className={cn(styles.drawer, { [styles.open]: isDrawerOpen })}
      >
        <MdClose className={styles.icon} onClick={closeDrawer} />
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            className={cn({ [styles.active]: location === item.href })}
            href={item.href}
            onClick={closeDrawer}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <main>{children}</main>
    </Theme>
  );
};
