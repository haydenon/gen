import {
  PropertiesBase,
  PropertyDefinition,
  Resource,
  def,
  string,
  int,
  ResolvedValues,
} from '@haydenon/gen-core';
import { RemoveIndex } from '@haydenon/gen-core/src/resources/resource';

class TestInputs extends PropertiesBase {
  text: PropertyDefinition<string> = def(string());
}

class TestOutputs extends TestInputs {
  id: PropertyDefinition<number> = def(int());
}

let id = 1;

class Test extends Resource<TestInputs, TestOutputs> {
  constructor() {
    super(new TestInputs(), new TestOutputs());
  }

  create(
    inputs: ResolvedValues<TestInputs>
  ): Promise<RemoveIndex<ResolvedValues<TestOutputs>>> {
    return Promise.resolve({
      ...inputs,
      id: id++,
    });
  }
}

export default new Test();
