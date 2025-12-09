import { useEffect, useState } from "react";
import { debounce } from "lodash";

import { useTournamentStore } from "@/store/tournamentStore";
import { TournamentInfo } from "@/types/top8/TournamentTypes";

import styles from "./TournamentEditor.module.scss";
import { Input } from "@/components/shared/Input/Input";

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
