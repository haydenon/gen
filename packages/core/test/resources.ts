import {
  PropertiesBase,
  PropertyDefinition,
  def,
  int,
  bool,
  string,
  Resource,
  OutputValues,
  getLink,
  ResolvedValues,
  dependentGenerator,
  lookup,
  resolve,
} from '../src/resources';

export class MockBase extends PropertiesBase {
  text: PropertyDefinition<string> = def(string());
  number: PropertyDefinition<number> = def(int());
  boolean: PropertyDefinition<boolean> = def(bool());
}

let mockId = 1;
class MockOutputs extends MockBase {
  id: PropertyDefinition<number> = def(int());
}

class MockDefinition extends Resource<MockBase, MockOutputs> {
  constructor(private time?: number) {
    super(new MockBase(), new MockOutputs(), (o) => o.id);
  }

  create(inputs: ResolvedValues<MockBase>): Promise<OutputValues<MockOutputs>> {
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
    super(new MockBase(), new MockOutputs(), (o) => o.id);
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
    super(new MockBase(), new MockOutputs(), (o) => o.id);
  }

  create(): Promise<OutputValues<MockOutputs>> {
    return Promise.reject(new Error('Failed to create'));
  }

  createTimeoutMillis = 200;
}
export const ErrorResource = new ErrorDefinition();

let subId = 1;
class SubBase extends PropertiesBase {
  mockId: PropertyDefinition<number> = def(getLink(MockResource, (r) => r.id));
  text: PropertyDefinition<string> = def(string());
  inheritedMockText: PropertyDefinition<string> = def(
    string(
      dependentGenerator(this, (values) =>
        resolve(MockResource, values.mockId, (mock) => mock.text)
      )
    )
  );
}
class SubOutputs extends SubBase {
  id: PropertyDefinition<number> = def(int());
  mockId: PropertyDefinition<number> = def(getLink(MockResource, (r) => r.id));
  text: PropertyDefinition<string> = def(string());
}
class SubDefinition extends Resource<SubBase, SubOutputs> {
  constructor() {
    super(new SubBase(), new SubOutputs(), (o) => o.id);
  }

  create(inputs: ResolvedValues<SubBase>): Promise<OutputValues<SubOutputs>> {
    return Promise.resolve({
      ...inputs,
      id: subId++,
    });
  }
}
export const SubResource = new SubDefinition();

let subSubId = 1;
class SubSubBase extends PropertiesBase {
  subId: PropertyDefinition<number> = def(getLink(SubResource, (r) => r.id));
  text: PropertyDefinition<string> = def(string());
  inheritedMockText: PropertyDefinition<string> = def(
    string(
      dependentGenerator(this, (values) =>
        resolve(
          MockResource,
          resolve(SubResource, values.subId, (sub) => sub.mockId),
          (mock) => mock.text
        )
      )
    )
  );
}
class SubSubOutputs extends SubSubBase {
  id: PropertyDefinition<number> = def(int());
  text: PropertyDefinition<string> = def(string());
}
class SubSubDefinition extends Resource<SubSubBase, SubSubOutputs> {
  constructor() {
    super(new SubSubBase(), new SubSubOutputs(), (o) => o.id);
  }

  create(
    inputs: ResolvedValues<SubSubBase>
  ): Promise<OutputValues<SubSubOutputs>> {
    return Promise.resolve({
      ...inputs,
      id: subSubId++,
    });
  }
}
export const SubSubResource = new SubSubDefinition();

// PassThrough resource for testing processKnownOutputs
// Has a 'value' property that is both an input and output (pass-through)
let passThroughId = 1;
class PassThroughBase extends PropertiesBase {
  value: PropertyDefinition<string> = def(string());
}
class PassThroughOutputs extends PassThroughBase {
  id: PropertyDefinition<number> = def(int());
  value: PropertyDefinition<string> = def(string());
}
class PassThroughDefinition extends Resource<
  PassThroughBase,
  PassThroughOutputs
> {
  constructor() {
    super(new PassThroughBase(), new PassThroughOutputs(), (o) => o.id);
  }

  create(
    inputs: ResolvedValues<PassThroughBase>
  ): Promise<OutputValues<PassThroughOutputs>> {
    return Promise.resolve({
      ...inputs,
      id: passThroughId++,
    });
  }
}
export const PassThroughResource = new PassThroughDefinition();

// Consumer resource for testing processKnownOutputs
// Consumes values from other resources
let consumerId = 1;
class ConsumerBase extends PropertiesBase {
  consumedValue: PropertyDefinition<string> = def(string());
}
class ConsumerOutputs extends ConsumerBase {
  id: PropertyDefinition<number> = def(int());
  consumedValue: PropertyDefinition<string> = def(string());
}
class ConsumerDefinition extends Resource<ConsumerBase, ConsumerOutputs> {
  constructor() {
    super(new ConsumerBase(), new ConsumerOutputs(), (o) => o.id);
  }

  create(
    inputs: ResolvedValues<ConsumerBase>
  ): Promise<OutputValues<ConsumerOutputs>> {
    return Promise.resolve({
      ...inputs,
      id: consumerId++,
    });
  }
}
export const ConsumerResource = new ConsumerDefinition();

// DelayedPassThrough resource for testing dependency ordering
// Has a 50ms delay to make timing explicit
let delayedPassThroughId = 1;
class DelayedPassThroughBase extends PropertiesBase {
  value: PropertyDefinition<string> = def(string());
}
class DelayedPassThroughOutputs extends DelayedPassThroughBase {
  id: PropertyDefinition<number> = def(int());
  value: PropertyDefinition<string> = def(string());
}
class DelayedPassThroughDefinition extends Resource<
  DelayedPassThroughBase,
  DelayedPassThroughOutputs
> {
  constructor() {
    super(
      new DelayedPassThroughBase(),
      new DelayedPassThroughOutputs(),
      (o) => o.id
    );
  }

  create(
    inputs: ResolvedValues<DelayedPassThroughBase>
  ): Promise<OutputValues<DelayedPassThroughOutputs>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...inputs,
          id: delayedPassThroughId++,
        });
      }, 50);
    });
  }
}
export const DelayedPassThroughResource = new DelayedPassThroughDefinition();

// DependsOn resource for testing explicit dependencies
// Uses dependsOn() to declare dependency on DelayedPassThroughResource
// Has a 10ms delay (faster than dependency)
let dependsOnId = 1;
class DependsOnBase extends PropertiesBase {
  passThroughId: PropertyDefinition<number> = def(
    getLink(DelayedPassThroughResource, (r) => r.id)
  );
  text: PropertyDefinition<string> = def(string());
}
class DependsOnOutputs extends DependsOnBase {
  id: PropertyDefinition<number> = def(int());
}
class DependsOnDefinition extends Resource<DependsOnBase, DependsOnOutputs> {
  constructor() {
    super(new DependsOnBase(), new DependsOnOutputs(), (o) => o.id);

    // Explicitly declare dependency
    this.dependsOn(DelayedPassThroughResource, (i) => i.passThroughId);
  }

  create(
    inputs: ResolvedValues<DependsOnBase>
  ): Promise<OutputValues<DependsOnOutputs>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...inputs,
          id: dependsOnId++,
        });
      }, 10);
    });
  }
}
export const DependsOnResource = new DependsOnDefinition();

// WithoutDependsOn resource for testing that resources start simultaneously
// without explicit dependencies when linking to a pass-through property
// Has a 10ms delay (faster than dependency)
let withoutDependsOnId = 1;
class WithoutDependsOnBase extends PropertiesBase {
  // Link to the pass-through 'value' property (exists in both inputs and outputs)
  passThroughValue: PropertyDefinition<string> = def(
    getLink(DelayedPassThroughResource, (r) => r.value)
  );
  text: PropertyDefinition<string> = def(string());
}
class WithoutDependsOnOutputs extends WithoutDependsOnBase {
  id: PropertyDefinition<number> = def(int());
}
class WithoutDependsOnDefinition extends Resource<
  WithoutDependsOnBase,
  WithoutDependsOnOutputs
> {
  constructor() {
    super(new WithoutDependsOnBase(), new WithoutDependsOnOutputs(), (o) => o.id);
    // NOTE: No dependsOn() call - processKnownOutputs will replace RuntimeValue with static value
  }

  create(
    inputs: ResolvedValues<WithoutDependsOnBase>
  ): Promise<OutputValues<WithoutDependsOnOutputs>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...inputs,
          id: withoutDependsOnId++,
        });
      }, 10);
    });
  }
}
export const WithoutDependsOnResource = new WithoutDependsOnDefinition();

// DependsOnPassThrough resource for testing explicit dependencies on pass-through properties
// Links to the pass-through 'value' property and uses dependsOn()
// Has a 10ms delay (faster than dependency)
let dependsOnPassThroughId = 1;
class DependsOnPassThroughBase extends PropertiesBase {
  // Link to the pass-through 'value' property (exists in both inputs and outputs)
  passThroughValue: PropertyDefinition<string> = def(
    getLink(DelayedPassThroughResource, (r) => r.value)
  );
  text: PropertyDefinition<string> = def(string());
}
class DependsOnPassThroughOutputs extends DependsOnPassThroughBase {
  id: PropertyDefinition<number> = def(int());
}
class DependsOnPassThroughDefinition extends Resource<
  DependsOnPassThroughBase,
  DependsOnPassThroughOutputs
> {
  constructor() {
    super(
      new DependsOnPassThroughBase(),
      new DependsOnPassThroughOutputs(),
      (o) => o.id
    );

    // Explicitly declare dependency on pass-through value
    this.dependsOn(DelayedPassThroughResource, (i) => i.passThroughValue);
  }

  create(
    inputs: ResolvedValues<DependsOnPassThroughBase>
  ): Promise<OutputValues<DependsOnPassThroughOutputs>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...inputs,
          id: dependsOnPassThroughId++,
        });
      }, 10);
    });
  }
}
export const DependsOnPassThroughResource =
  new DependsOnPassThroughDefinition();
