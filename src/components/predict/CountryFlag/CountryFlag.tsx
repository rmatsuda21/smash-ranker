import { useState } from "react";

import styles from "./CountryFlag.module.scss";

type Props = {
  country: string | undefined;
  className?: string;
};

export const CountryFlag = ({ country, className }: Props) => {
  const [failed, setFailed] = useState(false);

  if (!country || failed) return null;

  const cc = country.toLowerCase();
  if (!/^[a-z]{2}$/.test(cc)) return null;

  return (
    <img
      className={className ?? styles.flag}
      src={`/assets/flags/${cc}.svg`}
      alt={country.toUpperCase()}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};
