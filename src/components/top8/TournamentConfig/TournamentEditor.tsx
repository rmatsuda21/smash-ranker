import { useEffect, useMemo, useRef, useState } from "react";
import { debounce, isEqual } from "lodash";
import cn from "classnames";

import { useTournamentStore } from "@/store/tournamentStore";
import { TournamentInfo } from "@/types/top8/Tournament";
import { Input } from "@/components/shared/Input/Input";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";

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
    [dispatch]
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

  return (
    <div className={cn(styles.wrapper, className)}>
      <p className={styles.label}>Icon</p>
      <AssetSelector
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
      <Input
        label="Tournament Name"
        name="tournamentName"
        id="tournamentName"
        type="text"
        value={tempTournament?.tournamentName}
        onChange={handleChange}
      />
      <Input
        label="Event Name"
        name="eventName"
        id="eventName"
        type="text"
        value={tempTournament?.eventName}
        onChange={handleChange}
      />
      <div className={styles.row}>
        <Input
          label="Date"
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
        <Input
          label="Entrants"
          name="entrants"
          id="entrants"
          type="number"
          value={tempTournament?.entrants.toString()}
          onChange={(event) =>
            handleChange({
              target: { name: "entrants", value: Number(event.target.value) },
            } as unknown as React.ChangeEvent<HTMLInputElement>)
          }
        />
      </div>
      <div className={styles.row}>
        <Input
          label="City"
          name="city"
          id="city"
          type="text"
          value={tempTournament?.location.city}
          onChange={handleLocationChange}
        />
        <Input
          label="State"
          name="state"
          id="state"
          type="text"
          value={tempTournament?.location.state}
          onChange={handleLocationChange}
        />
        <Input
          label="Country"
          name="country"
          id="country"
          type="text"
          value={tempTournament?.location.country}
          onChange={handleLocationChange}
        />
      </div>
      <Input
        label="Tournament URL"
        name="url"
        id="url"
        type="text"
        value={tempTournament?.url}
        onChange={handleChange}
      />
    </div>
  );
};
