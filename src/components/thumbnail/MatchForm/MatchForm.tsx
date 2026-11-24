import { useId } from "react";
import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { FaArrowRightArrowLeft, FaCopy } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { Checkbox } from "@/components/shared/Checkbox/Checkbox";
import { ConfirmableButton } from "@/components/shared/ConfirmableButton/ConfirmableButton";
import { GameSwitch } from "@/components/shared/GameSwitch/GameSwitch";
import { Input } from "@/components/shared/Input/Input";
import { Slider } from "@/components/shared/Slider/Slider";
import { CharacterAltPicker } from "@/components/top8/CharacterEditor/CharacterAltPicker/CharacterAltPicker";
import { CharacterSelect } from "@/components/top8/CharacterEditor/CharacterSelect/CharacterSelect";
import { MAX_ART_ZOOM, MIN_ART_ZOOM } from "@/consts/thumbnail/thumbnail";
import { selectCurrentMatch, useThumbnailStore } from "@/store/thumbnailStore";
import type { CharacerData } from "@/types/top8/Player";
import { hasCharacter } from "@/utils/thumbnail/assets";
import { videoTitle } from "@/utils/thumbnail/match";
import { getCharacterDisplayName } from "@/utils/top8/getCharacterName";

import styles from "./MatchForm.module.scss";

const SIDE_TITLES: [MessageDescriptor, MessageDescriptor] = [
  msg`Player 1 (left)`,
  msg`Player 2 (right)`,
];

const ROUND_PRESETS: MessageDescriptor[] = [
  msg`Winners Final`,
  msg`Losers Final`,
  msg`Grand Final`,
  msg`Top 8`,
  msg`Pools`,
];

const SideFields = ({ index }: { index: 0 | 1 }) => {
  const { _ } = useLingui();
  const id = useId();
  const side = useThumbnailStore((s) => selectCurrentMatch(s).sides[index]);
  const game = useThumbnailStore((s) => s.game);
  const updateSide = useThumbnailStore((s) => s.updateSide);

  const character: CharacerData = {
    id: side.characterId,
    alt: side.alt as CharacerData["alt"],
  };
  const artMoved =
    side.zoom !== 1 || side.offset.x !== 0 || side.offset.y !== 0;

  return (
    <section className={styles.side}>
      <h3 className={styles.sideTitle}>{_(SIDE_TITLES[index])}</h3>

      <div className={styles.names}>
        <Input
          id={`${id}-sponsor`}
          label={_(msg`Sponsor`)}
          value={side.sponsor}
          autoComplete="off"
          onChange={(e) =>
            updateSide(index, { sponsor: e.currentTarget.value }, "sponsor")
          }
        />
        <Input
          id={`${id}-name`}
          label={_(msg`Name`)}
          value={side.name}
          autoComplete="off"
          onChange={(e) =>
            updateSide(index, { name: e.currentTarget.value }, "name")
          }
        />
      </div>

      <CharacterSelect
        game={game}
        selectedCharacter={character}
        onValueChange={(characterId) =>
          updateSide(index, { characterId, alt: 0 }, "")
        }
      />
      {hasCharacter(side) && (
        <CharacterAltPicker
          name={`${id}-alt`}
          selectedCharacter={character}
          onAltChange={(alt) => updateSide(index, { alt }, "")}
        />
      )}

      <div className={styles.art}>
        <Slider
          className={styles.zoom}
          id={`${id}-zoom`}
          label={_(msg`Zoom`)}
          labelInLine
          size="sm"
          min={MIN_ART_ZOOM * 100}
          max={MAX_ART_ZOOM * 100}
          value={Math.round(side.zoom * 100)}
          onValueChange={(value) =>
            updateSide(index, { zoom: value / 100 }, "zoom")
          }
        />
        <Checkbox
          size="sm"
          label={_(msg`Flip`)}
          checked={side.flip}
          onChange={(flip) => updateSide(index, { flip }, "")}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={!artMoved}
          onClick={() =>
            updateSide(index, { zoom: 1, offset: { x: 0, y: 0 } }, "")
          }
        >
          <Trans>Reset</Trans>
        </Button>
      </div>
    </section>
  );
};

// Everything that changes from one thumbnail to the next: the two players
// and the round.
export const MatchForm = () => {
  const { _, i18n } = useLingui();
  const id = useId();
  const match = useThumbnailStore(selectCurrentMatch);
  const hasEvent = useThumbnailStore((s) => s.event !== null);
  const game = useThumbnailStore((s) => s.game);
  const eventText = useThumbnailStore((s) => s.look.eventText);
  const setGame = useThumbnailStore((s) => s.setGame);
  const setRound = useThumbnailStore((s) => s.setRound);
  const swapSides = useThumbnailStore((s) => s.swapSides);

  const characterName = (index: 0 | 1) =>
    hasCharacter(match.sides[index])
      ? getCharacterDisplayName(match.sides[index].characterId, i18n.locale)
      : null;
  const title = videoTitle(match, eventText, [
    characterName(0),
    characterName(1),
  ]);

  const copyTitle = async () => {
    try {
      await navigator.clipboard.writeText(title);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className={styles.root}>
      {/* An event says which game it is; without one the user does. */}
      {!hasEvent && (
        <GameSwitch className={styles.game} value={game} onChange={setGame} />
      )}

      <SideFields index={0} />
      <Button
        className={styles.swap}
        variant="outline"
        size="sm"
        onClick={swapSides}
      >
        <FaArrowRightArrowLeft />
        <Trans>Swap sides</Trans>
      </Button>
      <SideFields index={1} />

      <section className={styles.round}>
        <Input
          id={`${id}-round`}
          label={_(msg`Round`)}
          value={match.round}
          autoComplete="off"
          onChange={(e) => setRound(e.currentTarget.value)}
        />
        <div className={styles.presets}>
          {ROUND_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.preset}
              onClick={() => setRound(_(preset))}
            >
              {_(preset)}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.title}>
        <h3 className={styles.sideTitle}>
          <Trans>Video title</Trans>
        </h3>
        <div className={styles.titleRow}>
          <p className={styles.titleText}>{title}</p>
          <ConfirmableButton
            size="sm"
            icon={<FaCopy />}
            label={<Trans>Copy</Trans>}
            confirmLabel={<Trans>Copied!</Trans>}
            failLabel={<Trans>Copy failed</Trans>}
            onAction={copyTitle}
          />
        </div>
      </section>
    </div>
  );
};
