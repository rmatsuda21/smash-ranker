import { TextField } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { debounce } from "lodash";

import { useTournamentStore } from "@/store/tournamentStore";
import { TournamentInfo } from "@/types/top8/TournamentTypes";

import styles from "./TournamentEditor.module.scss";

const DEBOUNCE_TIME = 100;

const formatDateForInput = (date: Date | undefined): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateForInput = (date: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const TournamentEditor = () => {
  const tournament = useTournamentStore((state) => state.info);
  const dispatch = useTournamentStore((state) => state.dispatch);

  const [tempTournament, setTempTournament] =
    useState<TournamentInfo>(tournament);

  useEffect(() => {
    setTempTournament(tournament);
  }, [tournament]);

  const debouncedUpdateTournament = debounce((tournament: TournamentInfo) => {
    dispatch({
      type: "SET_TOURNAMENT_INFO",
      payload: tournament,
    });
  }, DEBOUNCE_TIME);

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

  return (
    <div className={styles.wrapper}>
      <label htmlFor="tournamentName">Tournament Name</label>
      <TextField.Root
        className={styles.input}
        name="tournamentName"
        id="tournamentName"
        type="text"
        value={tempTournament?.tournamentName}
        onChange={handleChange}
      />
      <label htmlFor="eventName">Event Name</label>
      <TextField.Root
        className={styles.input}
        name="eventName"
        id="eventName"
        type="text"
        value={tempTournament?.eventName}
        onChange={handleChange}
      />
      <label htmlFor="date">Date</label>
      <TextField.Root
        className={styles.input}
        name="date"
        id="date"
        type="date"
        value={formatDateForInput(tempTournament?.date)}
        onChange={handleDateChange}
      />
      <label htmlFor="city">City</label>
      <TextField.Root
        className={styles.input}
        name="city"
        id="city"
        type="text"
        value={tempTournament?.location.city}
        onChange={handleLocationChange}
      />
      <label htmlFor="state">State</label>
      <TextField.Root
        className={styles.input}
        name="state"
        id="state"
        type="text"
        value={tempTournament?.location.state}
        onChange={handleLocationChange}
      />
      <label htmlFor="country">Country</label>
      <TextField.Root
        className={styles.input}
        name="country"
        id="country"
        type="text"
        value={tempTournament?.location.country}
        onChange={handleLocationChange}
      />
      <label htmlFor="entrants">Entrants</label>
      <TextField.Root
        className={styles.input}
        name="entrants"
        id="entrants"
        type="number"
        value={tempTournament?.entrants}
        onChange={handleChange}
      />
    </div>
  );
};
