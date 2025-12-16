import { TournamentConfigEditor } from "@/components/top8/TournamentConfig/TournamentConfigEditor/TournamentConfigEditor";

type Props = {
  className?: string;
};

// TODO: Eventually make a tournament searcher here
export const TournamentConfig = ({ className }: Props) => {
  return (
    <div className={className}>
      <TournamentConfigEditor />
    </div>
  );
};
