import { atom } from 'recoil';
import { v4 as uuid } from 'uuid';

import {
  getKeyGenerator,
  StateNamespace,
  Item,
  createCompleted,
  createUninitialised,
} from '../../../data';
import { WELL_KNOWN_RUNTIME_VALUES } from '../runtime-value';
import { DesiredResource } from './desired-resource';

export enum StateKey {
  DesiredResources = 'DesiredResources',
  Creating = 'Creating',
}

const getKey = getKeyGenerator(StateNamespace.DesiredResource);

const TEST_RESOURCES: DesiredResource[] = [
  {
    id: uuid(),
    type: 'Photo',
    name: 'SomePhoto',
    fieldData: {
      date: WELL_KNOWN_RUNTIME_VALUES.minDate,
      numberArray: [],
    },
  },
  {
    id: uuid(),
    type: 'Order',
    name: 'SomeOrder',
    fieldData: {
      orderItems: [{ id: 1, quantity: 1, note: '' }],
      // memberDiscount: 4,
      // shippingInformation: {
      //   price: 12.3,
      //   minDays: 1,
      //   maxDays: 2,
      //   carrier: 'UPS',
      // },
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
