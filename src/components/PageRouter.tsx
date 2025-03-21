import { Route, Switch } from "wouter";

import { Home } from "@/pages/home";
import { RankerPage } from "@/pages/ranker";

export const PageRouter = () => {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/ranker" component={RankerPage} />
    </Switch>
  );
};
