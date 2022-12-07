import { atom } from 'recoil';

import {
  getKeyGenerator,
  StateNamespace,
  createUninitialised,
  Item,
} from '../../data';

import type { ResourceResponse } from '@haydenon/gen-server';

export enum StateKey {
  AllResources = 'AllResources',
}

const getKey = getKeyGenerator(StateNamespace.Resource);

export const resourceState = atom<Item<ResourceResponse[]>>({
  key: getKey(StateKey.AllResources),
  default: createUninitialised(),
});
