import { Route, Switch } from "wouter";

import { Home } from "@/pages/Home";
import { Ranker } from "@/pages/Ranker";

export const PageRouter = () => {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ranker" component={Ranker} />
    </Switch>
  );
};
