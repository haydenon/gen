export enum StateNamespace {
  Resource,
}

export const getKeyGenerator = (namespace: StateNamespace) => (key: string) =>
  `[${StateNamespace[namespace]}] ${key}`;
