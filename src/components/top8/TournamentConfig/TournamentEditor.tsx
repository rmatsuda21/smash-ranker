import { useEffect, useMemo, useRef, useState } from "react";
import debounce from "lodash/debounce";
import isEqual from "lodash/isEqual";
import { FaArrowUpRightFromSquare, FaLink } from "react-icons/fa6";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { useTournamentStore } from "@/store/tournamentStore";
import { TournamentInfo } from "@/types/top8/Tournament";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";
import {
  EditorCard,
  EditorPanel,
  Field,
  FieldRow,
  FieldStack,
} from "@/components/top8/EditorForm/EditorForm";

import styles from "./TournamentEditor.module.scss";

const DEBOUNCE_TIME = 100;

const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateForInput = (date: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toISOString();
};

type Props = {
  className?: string;
};

export const TournamentEditor = ({ className }: Props) => {
  const { _ } = useLingui();
  const tournament = useTournamentStore((state) => state.info);
  const dispatch = useTournamentStore((state) => state.dispatch);

  const [tempTournament, setTempTournament] =
    useState<TournamentInfo>(tournament);

  const lastSyncedTournament = useRef<TournamentInfo>(tournament);

  useEffect(() => {
    if (!isEqual(tournament, lastSyncedTournament.current)) {
      setTempTournament(tournament);
      lastSyncedTournament.current = tournament;
    }
  }, [tournament]);

  const debouncedUpdateTournament = useMemo(
    () =>
      debounce((tournament: TournamentInfo) => {
        lastSyncedTournament.current = tournament;
        dispatch({
          type: "SET_TOURNAMENT_INFO",
          payload: tournament,
        });
      }, DEBOUNCE_TIME),
    [dispatch],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTournament = {
      ...tempTournament,
      [event.target.name]: event.target.value,
    };
    setTempTournament(newTournament);
    debouncedUpdateTournament(newTournament);
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTournament = {
      ...tempTournament,
      location: {
        ...tempTournament.location,
        [event.target.name]: event.target.value,
      },
    };
    setTempTournament(newTournament);
    debouncedUpdateTournament(newTournament);
  };

  const url = tempTournament?.url ?? "";
  const canOpenUrl = /^https?:\/\//i.test(url);

  return (
    <EditorPanel className={className}>
      <EditorCard horizontal className={styles.identity}>
        <AssetSelector
          variant="tile"
          aria-label={_(msg`Icon`)}
          selectedSrc={tempTournament?.iconSrc}
          onSelect={(src) =>
            handleChange({
              target: { name: "iconSrc", value: src },
            } as unknown as React.ChangeEvent<HTMLInputElement>)
          }
          onClear={() =>
            handleChange({
              target: { name: "iconSrc", value: undefined },
            } as unknown as React.ChangeEvent<HTMLInputElement>)
          }
        />
        <FieldStack>
          <Field
            strong
            name="tournamentName"
            id="tournamentName"
            type="text"
            autoComplete="off"
            aria-label={_(msg`Tournament Name`)}
            placeholder={_(msg`Tournament Name`)}
            value={tempTournament?.tournamentName}
            onChange={handleChange}
          />
          <Field
            name="eventName"
            id="eventName"
            type="text"
            autoComplete="off"
            aria-label={_(msg`Event Name`)}
            placeholder={_(msg`Event Name`)}
            value={tempTournament?.eventName}
            onChange={handleChange}
          />
        </FieldStack>
      </EditorCard>

      <EditorCard title={<Trans>Details</Trans>}>
        <FieldRow>
          <Field
            label={_(msg`Date`)}
            name="date"
            id="date"
            type="date"
            value={formatDateForInput(tempTournament?.date)}
            onChange={(event) =>
              handleChange({
                target: {
                  name: "date",
                  value: parseDateForInput(event.target.value),
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          />
          <Field
            label={_(msg`Entrants`)}
            name="entrants"
            id="entrants"
            type="number"
            min={0}
            inputMode="numeric"
            value={tempTournament?.entrants.toString()}
            onChange={(event) =>
              handleChange({
                target: { name: "entrants", value: Number(event.target.value) },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </FieldRow>
        <Field
          label={_(msg`Tournament URL`)}
          name="url"
          id="url"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://"
          value={url}
          onChange={handleChange}
          prefix={<FaLink />}
          trailing={
            canOpenUrl && (
              <a
                className={styles.openLink}
                href={url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={_(msg`Open link`)}
                title={_(msg`Open link`)}
              >
                <FaArrowUpRightFromSquare />
              </a>
            )
          }
        />
      </EditorCard>

      <EditorCard title={<Trans>Location</Trans>}>
        <Field
          label={_(msg`City`)}
          name="city"
          id="city"
          type="text"
          value={tempTournament?.location.city ?? ""}
          onChange={handleLocationChange}
        />
        <FieldRow>
          <Field
            label={_(msg`State`)}
            name="state"
            id="state"
            type="text"
            value={tempTournament?.location.state ?? ""}
            onChange={handleLocationChange}
          />
          <Field
            label={_(msg`Country`)}
            name="country"
            id="country"
            type="text"
            value={tempTournament?.location.country ?? ""}
            onChange={handleLocationChange}
          />
        </FieldRow>
      </EditorCard>
    </EditorPanel>
  );
};
