export const createAsyncQueue = (concurrency: number) => {
  let running = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (queue.length > 0 && running < concurrency) {
      running++;
      queue.shift()!();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        fn().then(resolve, reject).finally(() => {
          running--;
          next();
        });
      });
      next();
    });
};
