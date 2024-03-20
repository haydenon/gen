export enum StateNamespace {
  Resource,
  DesiredResource,
  Environment,
}

export const getKeyGenerator = (namespace: StateNamespace) => (key: string) =>
  `[${StateNamespace[namespace]}] ${key}`;
