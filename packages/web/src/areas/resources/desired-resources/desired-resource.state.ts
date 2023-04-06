import { CreatedStateItem } from '@haydenon/gen-server';
import { atom } from 'recoil';

import {
  getKeyGenerator,
  StateNamespace,
  Item,
  createUninitialised,
} from '../../../data';
import { DesiredResource, DesiredStateFormError } from './desired-resource';

export enum StateKey {
  DesiredResources = 'DesiredResources',
  Creating = 'Creating',
  FormErrors = 'FormErrors',
  ResourceDependencies = 'ResourceDependencies',
}

const getKey = getKeyGenerator(StateNamespace.DesiredResource);

export const desiredResourceState = atom<Item<DesiredResource[]>>({
  key: getKey(StateKey.DesiredResources),
  default: createUninitialised(),
});

export interface CreatingState {
  resources: {
    [name: string]: Item<CreatedStateItem>;
  };
  requestState: Item<void>;
}

export const creatingState = atom<CreatingState>({
  key: getKey(StateKey.Creating),
  default: { resources: {}, requestState: createUninitialised() },
});

export const formErrorsState = atom<DesiredStateFormError[]>({
  key: getKey(StateKey.FormErrors),
  default: [],
});

interface ResourceDependency {
  dependantOnId: string;
  dependeeId: string;
  fieldPath: string[];
}

export const resourceDependencyState = atom<ResourceDependency[]>({
  key: getKey(StateKey.ResourceDependencies),
  default: [],
});
