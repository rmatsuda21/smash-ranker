import { Link } from "wouter";
import { FaArrowLeft } from "react-icons/fa6";

import styles from "./tos.module.scss";

const LAST_UPDATED = "2026-05-10";

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
          <h2>1. Acceptance of these terms</h2>
          <p>
            Smash Ranker (&ldquo;the Service&rdquo;, &ldquo;this site&rdquo;) is
            a free, fan-made web tool for generating graphics for Super Smash
            Bros. tournaments and communities. By accessing or using the Service
            &mdash; including the home page, the Tournament Ranker (
            <code>/ranker</code>), the Tier List Maker (<code>/tier</code>), the
            Predictions tool (<code>/predict</code>), and any other tools
            offered here &mdash; you agree to these Terms of Service. If you do
            not agree, please do not use the Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. About the Service</h2>
          <p>
            Smash Ranker is an independent, non-commercial, hobbyist project
            maintained by a single fan of the competitive Smash Bros. community.
            The Service is provided free of charge, contains no advertising, and
            generates graphics primarily in your browser using assets
            contributed by the community.
          </p>
          <p>
            <strong>
              Smash Ranker is not affiliated with, endorsed by, sponsored by, or
              in any way officially connected to Nintendo Co., Ltd., HAL
              Laboratory, Sora Ltd., Bandai Namco, or any other rights holder of
              the Super Smash Bros. series.
            </strong>{" "}
            It is also not affiliated with start.gg, Challonge, Tonamel, or any
            tournament organizer whose data may be displayed by the Service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>3. Intellectual property</h2>
          <p>
            Super Smash Bros., the names and likenesses of its characters, stock
            icons, character art, logos, and related trademarks and copyrights
            are the property of Nintendo Co., Ltd. and its licensors. The
            Service displays these assets as a transformative, non-commercial
            aid for the Smash Bros. community to create tournament, ranking, and
            prediction graphics. The Service does not host, distribute, or
            modify Nintendo&rsquo;s game software, ROMs, or other proprietary
            game files.
          </p>
          <p>
            All other site code, layout, design templates, and original assets
            created for the Service are the property of the Service&rsquo;s
            maintainer and are made available for personal, non-commercial use
            only.
          </p>
        </section>

        <section className={styles.section}>
          <h2>4. Your responsibility when exporting or sharing graphics</h2>
          <p>
            When you download, share, stream, post to social media, or otherwise
            distribute a graphic generated with the Service, you are solely
            responsible for ensuring your use complies with all applicable laws
            and the policies of the underlying rights holders. In particular,
            you agree to follow Nintendo&rsquo;s published policies, including:
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
          <p>
            Without limiting the above, you agree that graphics generated with
            the Service may not be:
          </p>
          <ul>
            <li>
              sold as physical or digital merchandise, used on commercial
              products, or otherwise commercialized outside of monetization
              channels expressly permitted by Nintendo;
            </li>
            <li>
              used in a way that implies official endorsement, sponsorship, or
              affiliation with Nintendo or any of its partners;
            </li>
            <li>
              used to misrepresent the results of a real tournament or to
              deceive viewers about official event outcomes.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Acceptable use</h2>
          <p>
            You agree not to use the Service to create, distribute, or promote
            any graphic or content that:
          </p>
          <ul>
            <li>
              harasses, threatens, defames, or doxxes another person or group;
            </li>
            <li>
              promotes hate speech, discrimination, or violence based on race,
              ethnicity, national origin, religion, gender, sexual orientation,
              disability, or any other protected characteristic;
            </li>
            <li>
              impersonates a real person, tournament, brand, or organization in
              a deceptive way;
            </li>
            <li>
              contains sexually explicit content, content sexualizing minors, or
              otherwise illegal content under any applicable law;
            </li>
            <li>
              facilitates fraud, scams, betting manipulation, or other unlawful
              activity;
            </li>
            <li>
              attempts to abuse, overload, scrape, or otherwise disrupt the
              Service or its underlying APIs (start.gg, Challonge, Tonamel, and
              others).
            </li>
          </ul>
          <p>
            I reserve the right, at my sole discretion and without notice, to
            refuse service, remove cached server-rendered content (such as the
            cached prediction images served from <code>/api</code>), or block
            access for users who violate these terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Custom content you upload</h2>
          <p>
            The Service lets you upload custom images, fonts, and backgrounds.
            By uploading content, you represent and warrant that you own that
            content or that you have all necessary rights and permissions to use
            it for the purposes you are using it (including any third-party
            trademarks or copyrighted material depicted). You retain all rights
            to content you create or upload.
          </p>
          <p>
            Custom uploads are stored locally in your browser (IndexedDB) and
            are not transmitted to or stored on the Service&rsquo;s servers.
            Clearing your browser data will remove them.
          </p>
        </section>

        <section className={styles.section}>
          <h2>7. Third-party tournament data</h2>
          <p>
            The Service fetches tournament information (entrants, brackets,
            placements, icons) from third-party platforms such as start.gg,
            Challonge, and Tonamel via their public APIs. The Service does not
            guarantee the accuracy, completeness, availability, or timeliness of
            any third-party data. Your use of that data is subject to the terms
            of the respective platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2>8. Disclaimer of warranties</h2>
          <p>
            The Service is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
            <strong>&ldquo;as available&rdquo;</strong>, without warranties of
            any kind, whether express or implied, including but not limited to
            warranties of merchantability, fitness for a particular purpose,
            non-infringement, accuracy, or uninterrupted availability. The
            Service may change, break, or be discontinued at any time without
            notice.
          </p>
        </section>

        <section className={styles.section}>
          <h2>9. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by applicable law, in no event shall
            the Service&rsquo;s maintainer be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss
            of profits, data, goodwill, or other intangible losses, arising out
            of or related to your use of the Service or any graphic generated
            with it. Your sole remedy for dissatisfaction with the Service is to
            stop using it.
          </p>
        </section>

        <section className={styles.section}>
          <h2>10. Reports of infringement and abuse</h2>
          <p>
            If you believe content generated, hosted, or cached by the Service
            infringes your intellectual property rights, or if you wish to
            report abusive content or a violation of these terms, please contact
            me at{" "}
            <a href="mailto:reo.matsuda@gmail.com">reo.matsuda@gmail.com</a>.
            Include enough detail (URLs, descriptions, your contact info, and
            the basis for your claim) for me to act in good faith. I will review
            reports promptly and take appropriate action, including removing
            cached content where warranted.
          </p>
        </section>

        <section className={styles.section}>
          <h2>11. Changes to these terms</h2>
          <p>
            These terms may be updated from time to time. The &ldquo;Last
            updated&rdquo; date at the top of this page reflects the version
            currently in effect. Material changes will be noted in the
            project&rsquo;s GitHub repository. Continued use of the Service
            after a change constitutes acceptance of the updated terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2>12. Contact</h2>
          <p>
            Questions about these terms or the Service can be sent to{" "}
            <a href="mailto:reo.matsuda@gmail.com">reo.matsuda@gmail.com</a> or
            filed as an issue at{" "}
            <a
              href="https://github.com/rmatsuda21/smash-ranker/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/rmatsuda21/smash-ranker
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
};

export default TosPage;
