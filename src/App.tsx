import { useState } from "react";

import styles from "./App.module.scss";
import { Route, Switch } from "wouter";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className={styles.root}>
        <h1>Vite + React</h1>

        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>

      <Switch>
        <Route path="/test" component={() => <div>Test</div>} />
      </Switch>
    </>
  );
}

export default App;
