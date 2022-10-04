import { InputMap, Item, ItemInstance } from '../items';
import { PropertyTypes } from '../items/properties';

const emailOutputs = {
  value: {
    type: PropertyTypes.String,
  },
};

type EmailOutputs = typeof emailOutputs;

class EmailDefinition extends Item<InputMap, EmailOutputs> {
  async create(): Promise<ItemInstance<EmailOutputs>> {
    return {
      values: {
        value: 'test@example.com',
      },
    };
  }
}

export const Email = new EmailDefinition({}, emailOutputs);
