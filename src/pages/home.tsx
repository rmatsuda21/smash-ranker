import { lazy, Suspense, useCallback, useRef } from "react";
import { Link } from "wouter";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";

import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { Card } from "@/components/shared/Card/Card";
import { Badge } from "@/components/shared/Badge/Badge";
import { SiteFooter } from "@/components/shared/SiteFooter/SiteFooter";
import { ToolArt, type ToolArtKind } from "@/components/home/ToolArt/ToolArt";
import { LoginPrompt } from "@/components/home/LoginPrompt/LoginPrompt";
import { useAuthUser } from "@/store/authStore";

import styles from "./home.module.scss";

// Only logged-in users need it, and it brings the start.gg client along.
const RecentTournaments = lazy(() =>
  import("@/components/home/RecentTournaments/RecentTournaments").then((m) => ({
    default: m.RecentTournaments,
  })),
);

type Tool = {
  to: string;
  art: ToolArtKind;
  title: MessageDescriptor;
  // A few words at most: the drawing does the explaining.
  caption: MessageDescriptor;
  flag?: "thumbnail-enabled" | "results-enabled";
  isNew?: boolean;
};

const TOOLS: Tool[] = [
  {
    to: "/ranker",
    art: "ranker",
    title: msg`Tournament Ranker`,
    caption: msg`Top 8 graphics`,
  },
  {
    to: "/tier",
    art: "tier",
    title: msg`Tier List Maker`,
    caption: msg`Character tier lists`,
  },
  {
    to: "/results",
    art: "recap",
    title: msg`Tournament Recap`,
    caption: msg`Your run, set by set`,
    flag: "results-enabled",
  },
  {
    to: "/thumbnail",
    art: "thumbnail",
    title: msg`Thumbnail Maker`,
    caption: msg`Video thumbnails`,
    flag: "thumbnail-enabled",
    isNew: true,
  },
  {
    to: "/predict",
    art: "predict",
    title: msg`Predictions`,
    caption: msg`Bracket predictions`,
  },
];

export const Home = () => {
  const { _ } = useLingui();
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const thumbnailEnabled = useFeatureFlag("thumbnail-enabled");
  const resultsEnabled = useFeatureFlag("results-enabled");
  const user = useAuthUser();
  const gamerTag = user?.gamerTag;
  const tools = TOOLS.filter(
    (tool) =>
      !tool.flag ||
      (tool.flag === "results-enabled" ? resultsEnabled : thumbnailEnabled),
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (e.clientX / clientWidth - 0.5) * 2;
    const y = (e.clientY / clientHeight - 0.5) * 2;

    if (orb1Ref.current) {
      orb1Ref.current.style.translate = `${x * 30}px ${y * 30}px`;
    }
    if (orb2Ref.current) {
      orb2Ref.current.style.translate = `${x * -20}px ${y * -20}px`;
    }
  }, []);

  return (
    <div
      className={cn(styles.root, user && styles.rootWide)}
      onMouseMove={handleMouseMove}
    >
      <div ref={orb1Ref} className={styles.orb1} aria-hidden="true" />
      <div ref={orb2Ref} className={styles.orb2} aria-hidden="true" />

      <section className={cn(styles.hero, user && styles.heroCompact)}>
        <div className={styles.heroContent}>
          <div className={styles.logoWrap}>
            <div className={styles.blob} aria-hidden="true" />
            <img src="/favicon.svg" alt="" className={styles.heroLogo} />
          </div>
          <h1 className={styles.title}>
            Smash <span className={styles.accentText}>Ranker</span>
          </h1>
          {user ? (
            <p className={styles.tagline}>
              <Trans>
                Welcome back, <strong>{gamerTag}</strong>
              </Trans>
            </p>
          ) : (
            <>
              <p className={styles.tagline}>
                <Trans>Your one-stop site for Smash Bros graphics!</Trans>
              </p>
              <LoginPrompt />
            </>
          )}
        </div>
      </section>

      {user && (
        <Suspense>
          <RecentTournaments />
        </Suspense>
      )}

      <section className={styles.tools}>
        <h2 className={styles.sectionTitle}>
          <Trans>Tools</Trans>
        </h2>
        <div
          className={styles.cardGrid}
          style={{ "--tool-count": tools.length } as React.CSSProperties}
        >
          {tools.map((tool, i) => (
            <Card
              key={tool.to}
              as={Link}
              to={tool.to}
              variant="interactive"
              className={styles.card}
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <ToolArt kind={tool.art} />
              {tool.isNew && (
                <Badge variant="new" className={styles.cardBadge}>
                  <Trans>New</Trans>
                </Badge>
              )}
              <div className={styles.cardText}>
                <h3 className={styles.cardTitle}>{_(tool.title)}</h3>
                <p className={styles.cardCaption}>{_(tool.caption)}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.roadmap}>
        <div className={styles.roadmapContent}>
          <Badge variant="status">
            <Trans>In Development</Trans>
          </Badge>
          <h2 className={styles.roadmapTitle}>
            <Trans>More tools on the way</Trans>
          </h2>
          <p className={styles.roadmapDescription}>
            <Trans>I have many exiciting tools on the way 🔧 Stay tuned!</Trans>
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};
