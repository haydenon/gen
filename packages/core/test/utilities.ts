export const runTimes = (times: number, action: () => void): void => {
  for (let i = 0; i < times; i++) {
    action();
  }
};
