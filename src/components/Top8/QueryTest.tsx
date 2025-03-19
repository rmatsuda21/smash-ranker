import { graphql } from "@/gql";
import { useQuery } from "urql";

const TodosQuery = graphql(`
  query GetEventPhases($slug: String) {
    event(slug: $slug) {
      phases {
        id
        name
      }
    }
  }
`);

export const QueryTest = () => {
  const [result] = useQuery({
    query: TodosQuery,
    variables: { slug: "tournament/genesis-9-1/event/ultimate-singles" },
  });

  const { data, fetching, error } = result;

  if (fetching) return <div>Loading...</div>;
  if (error) return <div>Oh no... {error.message}</div>;

  return (
    <div style={{ width: "500px" }}>{JSON.stringify(data?.event?.phases)}</div>
  );
};
