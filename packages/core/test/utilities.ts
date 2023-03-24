export const runTimes = (
  times: number,
  action: (idx: number) => void
): void => {
  for (let i = 0; i < times; i++) {
    action(i);
  }
};
