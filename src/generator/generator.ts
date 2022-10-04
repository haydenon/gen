import { InputMap, Item, ItemInstance, OutputMap } from '../items';
import { DesiredState } from '../items/desired-state';

export class Generator {
  constructor(private items: Item<InputMap, OutputMap>[]) {}

  *generateState(
    state: DesiredState<InputMap, Item<InputMap, OutputMap>>[]
  ): IterableIterator<Promise<ItemInstance<OutputMap>[]>> {
    // TODO: Generate tree
    for (const stateItem of state) {
      yield Promise.all([stateItem.item.create(stateItem.values)]);
    }
  }
}
