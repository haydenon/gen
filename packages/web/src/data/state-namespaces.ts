export enum StateNamespace {
  Resource,
  DesiredResource
}

export const getKeyGenerator = (namespace: StateNamespace) => (key: string) =>
  `[${StateNamespace[namespace]}] ${key}`;
