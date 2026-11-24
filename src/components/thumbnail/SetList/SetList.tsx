import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Plural, Trans } from "@lingui/react/macro";
import { FaDownload } from "react-icons/fa6";

import { Button } from "@/components/shared/Button/Button";
import { Checkbox } from "@/components/shared/Checkbox/Checkbox";
import {
  RadioGroup,
  type RadioGroupOption,
} from "@/components/shared/RadioGroup/RadioGroup";
import { hasMoreSets } from "@/hooks/thumbnail/useLoadThumbnailEvent";
import { useThumbnailStore } from "@/store/thumbnailStore";
import type {
  ThumbnailSet,
  ThumbnailSetFilter,
  ThumbnailSide,
} from "@/types/thumbnail/Thumbnail";
import { hasCharacter } from "@/utils/thumbnail/assets";
import { filterSets } from "@/utils/thumbnail/match";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

import styles from "./SetList.module.scss";

type Props = {
  onSave: (sets: ThumbnailSet[]) => void;
  onLoadMore: () => void;
  fetchingMore: boolean;
  // Called after a set is picked, so a phone can move on to the match.
  onPick?: () => void;
};

const Stock = ({ side }: { side: ThumbnailSide }) =>
  hasCharacter(side) ? (
    <img
      className={styles.stock}
      src={getCharImgUrl({
        characterId: side.characterId,
        alt: side.alt,
        type: "stock",
      })}
      alt=""
      loading="lazy"
    />
  ) : (
    <span className={cn(styles.stock, styles.unknown)} aria-hidden="true">
      ?
    </span>
  );

// The loaded event's sets: pick one to edit it, tick the ones to save.
export const SetList = ({
  onSave,
  onLoadMore,
  fetchingMore,
  onPick,
}: Props) => {
  const { _ } = useLingui();
  const sets = useThumbnailStore((s) => s.sets);
  const filter = useThumbnailStore((s) => s.filter);
  const event = useThumbnailStore((s) => s.event);
  const selectedSetId = useThumbnailStore((s) => s.selectedSetId);
  const setFilter = useThumbnailStore((s) => s.setFilter);
  const selectSet = useThumbnailStore((s) => s.selectSet);
  const setIncluded = useThumbnailStore((s) => s.setIncluded);
  const clearEvent = useThumbnailStore((s) => s.clearEvent);

  const visible = filterSets(sets, filter);
  const included = visible.filter((set) => set.included);

  const filters: RadioGroupOption<ThumbnailSetFilter>[] = [
    { value: "stream", label: _(msg`On stream`) },
    { value: "top8", label: _(msg`Top 8`) },
    { value: "all", label: _(msg`All sets`) },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <RadioGroup
          className={styles.filters}
          options={filters}
          value={filter}
          onChange={setFilter}
        />
        <div className={styles.headRow}>
          <Checkbox
            size="sm"
            checked={visible.length > 0 && included.length === visible.length}
            disabled={visible.length === 0}
            onChange={(checked) =>
              setIncluded(
                visible.map((set) => set.id),
                checked,
              )
            }
            label={
              <Trans>
                {included.length} of {visible.length} selected
              </Trans>
            }
          />
          <Button variant="ghost" size="sm" onClick={clearEvent}>
            <Trans>Close event</Trans>
          </Button>
        </div>
      </div>

      <ul className={styles.list}>
        {visible.map((set) => {
          const [left, right] = set.sides;
          const missing = !hasCharacter(left) || !hasCharacter(right);
          return (
            <li
              key={set.id}
              className={cn(
                styles.row,
                set.id === selectedSetId && styles.selected,
              )}
            >
              <Checkbox
                className={styles.check}
                size="sm"
                checked={set.included}
                onChange={(checked) => setIncluded([set.id], checked)}
                label={
                  <span className={styles.srOnly}>
                    <Trans>
                      Include {left.name} vs {right.name}
                    </Trans>
                  </span>
                }
              />
              <button
                type="button"
                className={styles.pick}
                aria-current={set.id === selectedSetId}
                onClick={() => {
                  selectSet(set.id);
                  onPick?.();
                }}
              >
                <span className={styles.stocks}>
                  <Stock side={left} />
                  <Stock side={right} />
                </span>
                <span className={styles.text}>
                  <span className={styles.players}>
                    {left.name} <span className={styles.vs}>vs</span>{" "}
                    {right.name}
                  </span>
                  <span className={styles.round}>
                    {set.round}
                    {missing && (
                      <span className={styles.warning}>
                        <Trans>Pick a character</Trans>
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {visible.length === 0 && (
          <li className={styles.empty}>
            <Trans>No sets here. Try another filter.</Trans>
          </li>
        )}
        {hasMoreSets(event) && (
          <li className={styles.more}>
            <Button
              variant="outline"
              size="sm"
              loading={fetchingMore}
              onClick={onLoadMore}
            >
              <Trans>Load older sets</Trans>
            </Button>
          </li>
        )}
      </ul>

      <div className={styles.foot}>
        <Button
          fullWidth
          disabled={included.length === 0}
          onClick={() => onSave(included)}
        >
          <FaDownload />
          <Plural
            value={included.length}
            one="Save # image"
            other="Save # images"
          />
        </Button>
      </div>
    </div>
  );
};
