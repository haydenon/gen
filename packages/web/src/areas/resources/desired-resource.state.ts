import { atom } from 'recoil';

import {
  getKeyGenerator,
  StateNamespace,
  Item,
  createCompleted,
  createUninitialised,
} from '../../data';

import { DesiredResource } from './ResourceList';

export enum StateKey {
  DesiredResources = 'DesiredResources',
  Creating = 'Creating',
}

const getKey = getKeyGenerator(StateNamespace.DesiredResource);

let resourceId = 1;

export const nextResourceId = () => resourceId++;

const TEST_RESOURCES: DesiredResource[] = [
  {
    id: resourceId++,
    type: 'Service',
    name: 'SomeService',
    fieldData: {
      fulfiller: 'Window Washers United',
      name: 'Window Washing',
      price: 1.2,
    },
  },
  // {
  //   id: resourceId++,
  //   type: 'Product',
  //   name: 'SomeProduct',
  //   fieldData: {},
  // },
  // {
  //   id: resourceId++,
  //   type: 'Product',
  //   name: 'OtherProduct',
  //   fieldData: {},
  // },
  // {
  //   id: resourceId++,
  //   type: 'Member',
  //   name: 'SomeMember',
  //   fieldData: {},
  // },
  // {
  //   id: resourceId++,
  //   type: 'Order',
  //   name: 'Order',
  //   fieldData: {},
  // },
];

export const desiredResourceState = atom<Item<DesiredResource[]>>({
  key: getKey(StateKey.DesiredResources),
  default: createCompleted(TEST_RESOURCES),
});

export const creatingState = atom<Item<void>>({
  key: getKey(StateKey.Creating),
  default: createUninitialised(),
});
