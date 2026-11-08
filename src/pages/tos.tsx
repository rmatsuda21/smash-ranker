import { Link } from "wouter";
import { FaArrowLeft } from "react-icons/fa6";

import styles from "./tos.module.scss";

const LAST_UPDATED = "2026-11-08";

const TosPage = () => {
  return (
    <div className={styles.root}>
      <article className={styles.container}>
        <Link href="/" className={styles.backLink}>
          <FaArrowLeft />
          Back to home
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.updated}>Last updated: {LAST_UPDATED}</p>
        </header>

        <section className={styles.section}>
          <h2>1. Agreement</h2>
          <p>
            These terms apply to your use of Smash Ranker, a free, fan-made
            website for creating graphics for Super Smash Bros. tournaments and
            communities. By using any part of the site, you agree to these
            terms. If you do not agree, please do not use the site.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. About Smash Ranker</h2>
          <p>
            Smash Ranker is an independent, non-commercial project run by a
            single developer. It is free to use, does not display advertising,
            and generates most graphics directly in your browser.
          </p>
          <p>
            Smash Ranker is not affiliated with or endorsed by Nintendo Co.,
            Ltd., HAL Laboratory, Sora Ltd., Bandai Namco, or any other rights
            holder of the Super Smash Bros. series. It is also not affiliated
            with start.gg, Challonge, Tonamel, or any tournament organizer whose
            data appears on the site.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Intellectual property</h2>
          <p>
            Super Smash Bros. and its characters, stock icons, character art,
            logos, and related trademarks are the property of Nintendo Co., Ltd.
            and its licensors. Smash Ranker uses these assets only to help the
            community create non-commercial tournament, ranking, and prediction
            graphics. The site does not host or distribute any game software,
            ROMs, or game files.
          </p>
          <p>
            The site&rsquo;s code, design templates, and original artwork belong
            to its developer and may be used for personal, non-commercial
            purposes.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Sharing graphics</h2>
          <p>
            You are responsible for how you use any graphic you download or
            share from Smash Ranker, including on social media and streams. Your
            use must comply with applicable law and with Nintendo&rsquo;s
            published guidelines:
          </p>
          <ul>
            <li>
              <a
                href="https://www.nintendo.co.jp/networkservice_guideline/en/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Nintendo Game Content Guidelines for Online Video &amp; Image
                Sharing Platforms
              </a>
            </li>
            <li>
              <a
                href="https://en-americas-support.nintendo.com/app/answers/detail/a_id/63433/~/community-tournament-guidelines"
                target="_blank"
                rel="noopener noreferrer"
              >
                Nintendo Community Tournament Guidelines
              </a>
            </li>
          </ul>
          <p>Graphics made with Smash Ranker may not be:</p>
          <ul>
            <li>
              sold as merchandise or used on commercial products, except where
              Nintendo expressly permits that kind of monetization;
            </li>
            <li>
              used to suggest that Nintendo or its partners endorse or sponsor
              you or your event;
            </li>
            <li>used to misrepresent the results of a real tournament.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Acceptable use</h2>
          <p>You may not use Smash Ranker to create or share content that:</p>
          <ul>
            <li>
              harasses, threatens, defames, or doxxes any person or group;
            </li>
            <li>
              promotes hatred or discrimination based on race, ethnicity,
              nationality, religion, gender, sexual orientation, disability, or
              any other protected characteristic;
            </li>
            <li>
              impersonates a real person, event, or organization in a misleading
              way;
            </li>
            <li>
              is sexually explicit, sexualizes minors, or is otherwise illegal;
            </li>
            <li>supports fraud, scams, or betting manipulation.</li>
          </ul>
          <p>
            You also may not attempt to overload, scrape, or otherwise disrupt
            the site or the services it relies on, such as start.gg, Challonge,
            and Tonamel.
          </p>
          <p>
            Users who violate these terms may be blocked, and related cached
            content (such as prediction images served from <code>/api</code>)
            may be removed without notice.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Uploaded content</h2>
          <p>
            Smash Ranker allows you to upload your own images, fonts, and
            backgrounds. You may only upload content that you own or have
            permission to use, including any logos or artwork it contains. You
            keep all rights to your uploads.
          </p>
          <p>
            Uploads are stored locally in your browser (IndexedDB) and are not
            sent to Smash Ranker&rsquo;s servers. Clearing your browser data
            will delete them.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Third-party data</h2>
          <p>
            Tournament information such as entrants, brackets, placements, and
            icons is retrieved from start.gg, Challonge, and Tonamel through
            their public APIs. Smash Ranker does not guarantee that this data is
            accurate, complete, or available. Your use of it is also subject to
            each platform&rsquo;s own terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Disclaimer of warranties</h2>
          <p>
            Smash Ranker is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;, without warranties of any kind, express or
            implied, including warranties of merchantability, fitness for a
            particular purpose, non-infringement, accuracy, or availability.
            Features may change or be removed, and the site may be discontinued
            at any time without notice.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Limitation of liability</h2>
          <p>
            To the extent permitted by law, the developer of Smash Ranker is not
            liable for any indirect, incidental, special, consequential, or
            punitive damages, or for any loss of profits, data, or goodwill,
            arising from your use of the site or any graphic created with it. If
            you are dissatisfied with Smash Ranker, your only remedy is to stop
            using it.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Reporting infringement or abuse</h2>
          <p>
            If you believe content created, hosted, or cached by Smash Ranker
            infringes your rights, or you would like to report abuse, please
            email{" "}
            <a href="mailto:reo.matsuda@gmail.com">reo.matsuda@gmail.com</a>.
            Include a description of the content, where it appears (a URL if
            possible), the reason for your report, and your contact information.
            Reports will be reviewed and content removed where appropriate.
          </p>
          <p>
            Other questions about these terms can be sent to the same address.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Changes to these terms</h2>
          <p>
            These terms may be updated from time to time. The date at the top of
            this page shows when they were last revised. Continuing to use the
            site after an update means you accept the revised terms.
          </p>
        </section>
      </article>
    </div>
  );
};

export default TosPage;
