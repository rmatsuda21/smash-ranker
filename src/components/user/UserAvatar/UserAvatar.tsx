import cn from "classnames";

import type { AuthUser } from "@/types/user/AuthUser";

import styles from "./UserAvatar.module.scss";

type Props = {
  user: Pick<AuthUser, "avatarUrl" | "gamerTag">;
  size?: number;
  className?: string;
};

// Profile picture, or the tag's first letter when the account has none.
export const UserAvatar = ({ user, size = 32, className }: Props) => (
  <span
    className={cn(styles.avatar, className)}
    style={{ width: size, height: size, fontSize: size * 0.45 }}
    aria-hidden="true"
  >
    {user.avatarUrl ? (
      <img src={user.avatarUrl} alt="" />
    ) : (
      user.gamerTag.slice(0, 1).toUpperCase()
    )}
  </span>
);
