import { InputMap, Item, ItemInstance } from '../items';
import { PropertyType } from '../items/properties';

const emailOutputs = {
  value: {
    type: PropertyType.String,
  },
};

type EmailOutputs = typeof emailOutputs;

class EmailDefinition extends Item<InputMap, EmailOutputs> {
  create(): ItemInstance {
    return {
      item: this,
    };
  }
}

export const Email = new EmailDefinition({}, emailOutputs);
