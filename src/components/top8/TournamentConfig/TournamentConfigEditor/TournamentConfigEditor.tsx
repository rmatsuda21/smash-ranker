import { useEffect, useMemo, useRef, useState } from "react";
import { debounce, isEqual } from "lodash";

import { useTournamentStore } from "@/store/tournamentStore";
import { TournamentInfo } from "@/types/top8/TournamentTypes";
import { Input } from "@/components/shared/Input/Input";
import { FileUploader } from "@/components/top8/PlayerForm/FileUploader/FileUploader";

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

export const TournamentConfigEditor = () => {
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

  useEffect(() => {
    debouncedUpdateTournament(tempTournament);

    return () => {
      debouncedUpdateTournament.cancel();
    };
  }, [tempTournament, debouncedUpdateTournament]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempTournament({
      ...tempTournament,
      [event.target.name]: event.target.value,
    });
  };

  const handleLocationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempTournament({
      ...tempTournament,
      location: {
        ...tempTournament.location,
        [event.target.name]: event.target.value,
      },
    });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempTournament({
      ...tempTournament,
      date: parseDateForInput(event.target.value),
    });
  };

  const handleIconChange = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    dispatch({ type: "SET_ICON_SRC", payload: url });
  };

  return (
    <div className={styles.wrapper}>
      <FileUploader
        value={tempTournament?.iconSrc}
        onChange={handleIconChange}
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
      <Input
        label="Date"
        name="date"
        id="date"
        type="date"
        value={formatDateForInput(tempTournament?.date)}
        onChange={handleDateChange}
      />
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
      <Input
        label="Entrants"
        name="entrants"
        id="entrants"
        type="number"
        value={tempTournament?.entrants.toString()}
        onChange={handleChange}
      />
    </div>
  );
};
