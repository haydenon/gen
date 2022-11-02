export const truncate = (str: string, length: number): string =>
  str.length > length ? str.substring(0, length) : str;
