export enum ItemState {
  Uninitialised,
  Loading,
  Completed,
  Errored,
}

interface ItemDetails<T> {
  state: ItemState;
  isLoading: boolean;
  value?: T;
  error?: Error;
}

interface Uninitialised extends ItemDetails<any> {
  state: ItemState.Uninitialised;
  isLoading: false;
  value: undefined;
  error: undefined;
}

interface Loading extends ItemDetails<any> {
  state: ItemState.Loading;
  isLoading: true;
  value: undefined;
  error: undefined;
}

interface Completed<T> extends ItemDetails<T> {
  state: ItemState.Completed;
  isLoading: false;
  value: T;
  error: undefined;
}

interface Errored extends ItemDetails<any> {
  state: ItemState.Errored;
  isLoading: false;
  value: undefined;
  error: Error;
}

export type Item<T> = Uninitialised | Loading | Completed<T> | Errored;

const uninitialised: Uninitialised = {
  state: ItemState.Uninitialised,
  isLoading: false,
  value: undefined,
  error: undefined,
};
export const createUninitialised = (): Uninitialised => uninitialised;

const loading: Loading = {
  state: ItemState.Loading,
  isLoading: true,
  value: undefined,
  error: undefined,
};
export const createLoading = (): Loading => loading;

export const createCompleted = <T>(value: T): Completed<T> => ({
  state: ItemState.Completed,
  isLoading: false,
  value,
  error: undefined,
});

export const createErrored = (error: Error): Errored => ({
  state: ItemState.Errored,
  isLoading: false,
  value: undefined,
  error,
});

export const isUninitialisedOrLoading = (
  item: Item<any>
): item is Loading | Uninitialised =>
  item.state === ItemState.Loading || item.state === ItemState.Uninitialised;
