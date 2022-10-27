import {
  PropertiesBase,
  PropertyDefinition,
  def,
  int,
  bool,
  str,
  Resource,
  PropertyValues,
  OutputValues,
  getLink,
} from '../src/resources';

export class MockBase extends PropertiesBase {
  text: PropertyDefinition<string> = def(str());
  number: PropertyDefinition<number> = def(int());
  boolean: PropertyDefinition<boolean> = def(bool());
}

let mockId = 1;
class MockOutputs extends MockBase {
  id: PropertyDefinition<number> = def(int());
}

class MockDefinition extends Resource<MockBase, MockOutputs> {
  constructor(private time?: number) {
    super(new MockBase(), new MockOutputs());
  }

  create(inputs: PropertyValues<MockBase>): Promise<OutputValues<MockOutputs>> {
    const instance = {
      id: mockId++,
      text: inputs.text,
      number: inputs.number,
      boolean: inputs.boolean,
    };
    if (!this.time || this.time <= 0) {
      return Promise.resolve(instance);
    }

    return new Promise((res) => {
      setTimeout(() => res(instance), this.time);
    });
  }
}
export const MockResource = new MockDefinition();
export const DelayResource = new MockDefinition(100);

class StallDefinition extends Resource<MockBase, MockOutputs> {
  constructor() {
    super(new MockBase(), new MockOutputs());
  }

  create(): Promise<OutputValues<MockOutputs>> {
    return new Promise(() => {
      //
    });
  }

  createTimeoutMillis = 200;
}
export const StallResource = new StallDefinition();

class ErrorDefinition extends Resource<MockBase, MockOutputs> {
  constructor() {
    super(new MockBase(), new MockOutputs());
  }

  create(): Promise<OutputValues<MockOutputs>> {
    return Promise.reject(new Error('Failed to create'));
  }

  createTimeoutMillis = 200;
}
export const ErrorResource = new ErrorDefinition();

let subId = 1;
class SubBase extends PropertiesBase {
  mockId: PropertyDefinition<number> = def(getLink(MockResource, (m) => m.id));
}
class SubOutputs extends SubBase {
  id: PropertyDefinition<number> = def(int());
}
class SubDefinition extends Resource<SubBase, SubOutputs> {
  constructor() {
    super(new SubBase(), new SubOutputs());
  }

  create(inputs: PropertyValues<SubBase>): Promise<OutputValues<SubOutputs>> {
    return Promise.resolve({
      ...inputs,
      id: subId++,
    });
  }
}
export const SubResource = new SubDefinition();

let subSubId = 1;
class SubSubBase extends PropertiesBase {
  subId: PropertyDefinition<number> = def(getLink(SubResource, (s) => s.id));
}
class SubSubOutputs extends SubSubBase {
  id: PropertyDefinition<number> = def(int());
}
class SubSubDefinition extends Resource<SubSubBase, SubSubOutputs> {
  constructor() {
    super(new SubSubBase(), new SubSubOutputs());
  }

  create(
    inputs: PropertyValues<SubSubBase>
  ): Promise<OutputValues<SubSubOutputs>> {
    return Promise.resolve({
      ...inputs,
      id: subSubId++,
    });
  }
}
export const SubSubResource = new SubSubDefinition();