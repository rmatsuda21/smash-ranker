import { Link } from "wouter";
import { Trans, useLingui } from "@lingui/react/macro";
import { FaArrowLeft } from "react-icons/fa6";

import { loadTosCatalog } from "@/i18n";
import { useLazyCatalog } from "@/hooks/useLazyCatalog";

import styles from "./tos.module.scss";

const LAST_UPDATED = "2026-11-27";
const CONTACT_EMAIL = "contact@smash-ranker.app";

// Nintendo publishes each guideline per region and language; readers get the
// one written for them, English otherwise.
const NINTENDO_GUIDELINES = {
  en: {
    sharing: "https://www.nintendo.co.jp/networkservice_guideline/en/",
    tournaments:
      "https://en-americas-support.nintendo.com/app/answers/detail/a_id/63433/~/community-tournament-guidelines",
  },
  ja: {
    sharing: "https://www.nintendo.co.jp/networkservice_guideline/ja/",
    tournaments: "https://www.nintendo.co.jp/tournament_guideline/",
  },
};

const TosPage = () => {
  const { i18n } = useLingui();
  const ready = useLazyCatalog(loadTosCatalog, "tos");
  const guidelines =
    i18n.locale === "ja" ? NINTENDO_GUIDELINES.ja : NINTENDO_GUIDELINES.en;
  const updated = i18n.date(LAST_UPDATED, {
    dateStyle: "long",
    timeZone: "UTC",
  });

  if (!ready) return <div className={styles.root} />;

  return (
    <div className={styles.root}>
      {/* The page sets its own language: <html> keeps "en" in Japanese. */}
      <article className={styles.container} lang={i18n.locale}>
        <Link href="/" className={styles.backLink}>
          <FaArrowLeft />
          <Trans>Back to home</Trans>
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>
            <Trans>Terms of Service</Trans>
          </h1>
          <p className={styles.updated}>
            <Trans>Last updated: {updated}</Trans>
          </p>
        </header>

        <section className={styles.section}>
          <h2>
            <Trans>1. Agreement</Trans>
          </h2>
          <p>
            <Trans>
              These terms apply to your use of Smash Ranker, a free, fan-made
              website for creating graphics for Super Smash Bros. tournaments
              and communities. By using any part of the site, you agree to these
              terms. If you do not agree, please do not use the site.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>2. About Smash Ranker</Trans>
          </h2>
          <p>
            <Trans>
              Smash Ranker is an independent, non-commercial project run by a
              single developer. It is free to use, does not display advertising,
              and generates most graphics directly in your browser.
            </Trans>
          </p>
          <p>
            <Trans>
              Smash Ranker is not affiliated with or endorsed by Nintendo Co.,
              Ltd., HAL Laboratory, Sora Ltd., Bandai Namco, or any other rights
              holder of the Super Smash Bros. series. It is also not affiliated
              with start.gg, Challonge, Tonamel, Hivee, or any tournament
              organizer whose data appears on the site.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>3. Intellectual property</Trans>
          </h2>
          <p>
            <Trans>
              Super Smash Bros. and its characters, stock icons, character art,
              logos, and related trademarks are the property of Nintendo Co.,
              Ltd. and its licensors. Smash Ranker uses these assets only to
              help the community create non-commercial tournament, ranking, and
              prediction graphics. The site does not host or distribute any game
              software, ROMs, or game files.
            </Trans>
          </p>
          <p>
            <Trans>
              The site’s code, design templates, and original artwork belong to
              its developer and may be used for personal, non-commercial
              purposes.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>4. Sharing graphics</Trans>
          </h2>
          <p>
            <Trans>
              You are responsible for how you use any graphic you download or
              share from Smash Ranker, including on social media and streams.
              Your use must comply with applicable law and with Nintendo’s
              published guidelines:
            </Trans>
          </p>
          <ul>
            <li>
              <a
                href={guidelines.sharing}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Trans>
                  Nintendo Game Content Guidelines for Online Video & Image
                  Sharing Platforms
                </Trans>
              </a>
            </li>
            <li>
              <a
                href={guidelines.tournaments}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Trans>Nintendo Community Tournament Guidelines</Trans>
              </a>
            </li>
          </ul>
          <p>
            <Trans>Graphics made with Smash Ranker may not be:</Trans>
          </p>
          <ul>
            <li>
              <Trans>
                sold as merchandise or used on commercial products, except where
                Nintendo expressly permits that kind of monetization;
              </Trans>
            </li>
            <li>
              <Trans>
                used to suggest that Nintendo or its partners endorse or sponsor
                you or your event;
              </Trans>
            </li>
            <li>
              <Trans>
                used to misrepresent the results of a real tournament.
              </Trans>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>5. Acceptable use</Trans>
          </h2>
          <p>
            <Trans>
              You may not use Smash Ranker to create or share content that:
            </Trans>
          </p>
          <ul>
            <li>
              <Trans>
                harasses, threatens, defames, or doxxes any person or group;
              </Trans>
            </li>
            <li>
              <Trans>
                promotes hatred or discrimination based on race, ethnicity,
                nationality, religion, gender, sexual orientation, disability,
                or any other protected characteristic;
              </Trans>
            </li>
            <li>
              <Trans>
                impersonates a real person, event, or organization in a
                misleading way;
              </Trans>
            </li>
            <li>
              <Trans>
                is sexually explicit, sexualizes minors, or is otherwise
                illegal;
              </Trans>
            </li>
            <li>
              <Trans>supports fraud, scams, or betting manipulation.</Trans>
            </li>
          </ul>
          <p>
            <Trans>
              You also may not attempt to overload, scrape, or otherwise disrupt
              the site or the services it relies on, such as start.gg,
              Challonge, Tonamel, and Hivee.
            </Trans>
          </p>
          <p>
            <Trans>
              Users who violate these terms may be blocked, and related cached
              content (such as prediction images served from <code>/api</code>)
              may be removed without notice.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>6. Uploaded content</Trans>
          </h2>
          <p>
            <Trans>
              Smash Ranker allows you to upload your own images, fonts, and
              backgrounds. You may only upload content that you own or have
              permission to use, including any logos or artwork it contains. You
              keep all rights to your uploads.
            </Trans>
          </p>
          <p>
            <Trans>
              Uploads are stored locally in your browser (IndexedDB) and are not
              sent to Smash Ranker’s servers. Clearing your browser data will
              delete them.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>7. Third-party data</Trans>
          </h2>
          <p>
            <Trans>
              Tournament information such as entrants, brackets, placements, and
              icons is retrieved from start.gg, Challonge, Tonamel, and Hivee
              through their public APIs. Smash Ranker does not guarantee that
              this data is accurate, complete, or available. Your use of it is
              also subject to each platform’s own terms.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>8. Disclaimer of warranties</Trans>
          </h2>
          <p>
            <Trans>
              Smash Ranker is provided “as is” and “as available”, without
              warranties of any kind, express or implied, including warranties
              of merchantability, fitness for a particular purpose,
              non-infringement, accuracy, or availability. Features may change
              or be removed, and the site may be discontinued at any time
              without notice.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>9. Limitation of liability</Trans>
          </h2>
          <p>
            <Trans>
              Except in cases of intentional misconduct or gross negligence on
              their part, the developer of Smash Ranker is not liable for any
              indirect, incidental, special, consequential, or punitive damages,
              or for any loss of profits, data, or goodwill, arising from your
              use of the site or any graphic created with it. If you are
              dissatisfied with Smash Ranker, your only remedy is to stop using
              it.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>10. Privacy and data</Trans>
          </h2>
          <p>
            <Trans>
              Smash Ranker has no accounts of its own and no database of its
              users. Your designs, saved templates, uploaded images and fonts
              are stored in your own browser and are not uploaded.
            </Trans>
          </p>
          <p>
            <Trans>
              To see how the site is used and to find bugs, it records usage
              events (such as a tournament being loaded or a graphic being
              exported) and error reports. These are tied to a random identifier
              kept in your browser, not to your name, email or IP address, and
              tournament links are removed from them. Error reports include the
              page, your browser and an approximate region. This data is
              processed by PostHog, Sentry and Vercel, and is not sold or used
              for advertising.
            </Trans>
          </p>
          <p>
            <Trans>
              If you log in with start.gg, the site receives your public
              start.gg profile and an access token, which is kept in your
              browser and used to load your tournaments from start.gg. A cookie
              keeps you logged in. Logging out removes both.
            </Trans>
          </p>
          <p>
            <Trans>
              Prediction and recap graphics are drawn on the site's server: the
              names and results shown in the graphic are sent there to make the
              image, and the image may be cached.
            </Trans>
          </p>
          <p>
            <Trans>
              Clearing this site's data in your browser removes everything
              stored on your device.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>11. Reporting infringement or abuse</Trans>
          </h2>
          <p>
            <Trans>
              If you believe content created, hosted, or cached by Smash Ranker
              infringes your rights, or you would like to report abuse, please
              email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              Include a description of the content, where it appears (a URL if
              possible), the reason for your report, and your contact
              information. Reports will be reviewed and content removed where
              appropriate.
            </Trans>
          </p>
          <p>
            <Trans>
              Other questions about these terms can be sent to the same address.
            </Trans>
          </p>
        </section>

        <section className={styles.section}>
          <h2>
            <Trans>12. Changes to these terms</Trans>
          </h2>
          <p>
            <Trans>
              These terms may be updated from time to time. The date at the top
              of this page shows when they were last revised. Continuing to use
              the site after an update means you accept the revised terms.
            </Trans>
          </p>
        </section>
      </article>
    </div>
  );
};

export default TosPage;
