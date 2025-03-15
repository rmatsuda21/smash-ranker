import { useState } from "react";
import { Route, Switch } from "wouter";

import { Button, Heading } from "@radix-ui/themes";

import styles from "./App.module.scss";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className={styles.root}>
        <Heading size="9">Vite + React</Heading>

        <Button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
      </div>

      <Switch>
        <Route path="/test" component={() => <div>Test</div>} />
      </Switch>
    </>
  );
}

export default App;
