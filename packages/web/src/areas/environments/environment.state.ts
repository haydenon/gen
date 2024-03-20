import { atom } from 'recoil';

import {
  getKeyGenerator,
  StateNamespace,
  createUninitialised,
  Item,
} from '../../data';

export enum StateKey {
  AllEnvironments = 'AllEnvironments',
  CurrentEnvironment = 'CurrentEnvironment',
}

const getKey = getKeyGenerator(StateNamespace.Environment);

export const environmentsState = atom<Item<string[]>>({
  key: getKey(StateKey.AllEnvironments),
  default: createUninitialised(),
});

export const currentEnvironmentState = atom<string | undefined>({
  key: getKey(StateKey.CurrentEnvironment),
  default: undefined,
});
