import {
  array,
  bool,
  complex,
  createDesiredState,
  def,
  dependentGenerator,
  float,
  GenerationResult,
  generator,
  getLink,
  int,
  parentConstraint,
  PropertyDefinition,
  ResolvedInputs,
  string,
} from '../../resources';
import {
  InputValues,
  OutputValues,
  PropertiesBase,
  Resource,
} from '../../resources/resource';
import {
  MockBase,
  MockResource,
  SubResource,
  SubSubResource,
  runTimes,
} from '../../../test';
import { fillInDesiredStateTree } from './state-tree.generator';
import { Value } from '../../resources/properties';
import { ErasedDesiredState } from '../../resources/desired-state';
import {
  getRuntimeResourceValue,
  mapValue,
  mapValues,
  RuntimeValue,
} from '../../resources/runtime-values';
import {
  getOptionalLink,
  ParentCreationMode,
} from '../../resources/properties/links';

const anyMockInputs = {
  text: expect.anything(),
  number: expect.anything(),
  boolean: expect.anything(),
};

class AnyOutput extends PropertiesBase {}

class ValidDependentInput extends PropertiesBase {
  a: PropertyDefinition<string> = def(string());
  b: PropertyDefinition<string> = def(
    string(
      dependentGenerator(this, (values) =>
        mapValue(values.a, (a) => a.toUpperCase())
      )
    )
  );
  c: PropertyDefinition<string> = def(
    string(
      dependentGenerator(this, (values) =>
        mapValues([values.a, values.b], (a, b) => a.split(' ')[0] + b.length)
      )
    )
  );
}
class ValidResource extends Resource<ValidDependentInput, AnyOutput> {
  constructor() {
    super(new ValidDependentInput(), new AnyOutput());
  }
  create = () => Promise.resolve({});
}
const Valid = new ValidResource();

class CircularDependentInput extends PropertiesBase {
  a: PropertyDefinition<string> = def(
    string(
      dependentGenerator<CircularDependentInput, string>(
        this,
        (values) => values.b
      )
    )
  );
  b: PropertyDefinition<string> = def(
    string(
      dependentGenerator<CircularDependentInput, string>(
        this,
        (values) => values.a
      )
    )
  );
}
class CircularResource extends Resource<CircularDependentInput, AnyOutput> {
  constructor() {
    super(new CircularDependentInput(), new AnyOutput());
  }
  create = () => Promise.resolve({});
}
const Circular = new CircularResource();

interface ComplexValue {
  name: string;
  age: number;
  living: boolean;
  favouriteColours: string[];
}

const anyComplexValue = {
  name: expect.anything(),
  age: expect.anything(),
  living: expect.anything(),
  favouriteColours: expect.any(Array),
};

const anyGeneratedPrimative = 'primative_value';

jest.mock('./primatives.generator.ts', () => ({
  getValueForPrimativeType: jest
    .fn()
    .mockImplementation(() => anyGeneratedPrimative),
}));

const [minArrayCount, maxArrayCount] = [5, 50];

let overriddenDependentOutput: number | GenerationResult | undefined;
let overriddenStandardOutput: number | GenerationResult | undefined;

class AdvancedInput extends PropertiesBase {
  complex: PropertyDefinition<ComplexValue> = def(
    complex<ComplexValue>({
      name: string(),
      age: int(),
      living: bool(),
      favouriteColours: array(string()),
    })
  );
  array: PropertyDefinition<number[]> = def(
    array(float(), {
      minItems: minArrayCount,
      maxItems: maxArrayCount,
    })
  );
  arrayOfComplex: PropertyDefinition<ComplexValue[]> = def(
    array(
      complex<ComplexValue>({
        name: string(),
        age: int(),
        living: bool(),
        favouriteColours: array(string()),
      }),
      { minItems: 1 }
    )
  );
  generatedConstraint: PropertyDefinition<number> = def(
    int(generator(() => overriddenStandardOutput ?? 1))
  );
  dependentField: PropertyDefinition<number> = def(int());
  depdendentGeneratedConstraint: PropertyDefinition<number> = def(
    int(
      dependentGenerator(
        this,
        (values) => overriddenDependentOutput ?? values.dependentField
      )
    )
  );
}

class AdvancedResource extends Resource<AdvancedInput, AnyOutput> {
  constructor() {
    super(new AdvancedInput(), new AnyOutput());
  }
  create = () => Promise.resolve({});
}
const Advanced = new AdvancedResource();

describe('State tree creation', () => {
  beforeEach(() => {
    overriddenDependentOutput = undefined;
    overriddenStandardOutput = undefined;
  });

  test('does not fill in resource inputs with explicit inputs', async () => {
    // Arrange
    const PropertyValues: InputValues<MockBase> = {
      text: 'Test',
      boolean: true,
      number: 2,
    };
    const state = createDesiredState(MockResource, PropertyValues);
    const desiredState: ErasedDesiredState[] = [state];

    // Act
    const filledOutState = fillInDesiredStateTree(desiredState);

    // Assert
    expect(filledOutState).toEqual([state]);
  });

  test('fills in resource inputs with no values', async () => {
    // Arrange
    const state = createDesiredState(MockResource, {});
    const desiredState: ErasedDesiredState[] = [state];

    // Act
    const filledOutState = fillInDesiredStateTree(desiredState);

    // Assert
    expect(filledOutState).toEqual([state]);
  });

  test('can create anonymous depdendencies', async () => {
    // Arrange
    const state = [createDesiredState(SubSubResource, {})];

    // Act
    const filledOutState = fillInDesiredStateTree(state);

    // Assert
    expect(filledOutState).toHaveLength(3);
    const mockResource = filledOutState.find(
      (i) => i.resource === MockResource
    );
    expect(mockResource).toEqual({
      name: expect.any(String),
      resource: MockResource,
      inputs: anyMockInputs,
    });

    const subResource = filledOutState.find((i) => i.resource === SubResource);
    expect(subResource).toEqual({
      name: expect.anything(),
      resource: SubResource,
      inputs: {
        mockId: expect.any(RuntimeValue),
        text: expect.anything(),
      },
    });

    const subSubResource = filledOutState.find(
      (i) => i.resource === SubSubResource
    );
    expect(subSubResource).toEqual({
      name: expect.anything(),
      resource: SubSubResource,
      inputs: {
        subId: expect.any(RuntimeValue),
        text: expect.anything(),
      },
    });
  });

  [{}, { a: 'Test' }].forEach((values) =>
    test('supports filling in values with dependent generator', () => {
      // Arrange
      const state = [createDesiredState(Valid, values)];

      // Act
      const filledInState = fillInDesiredStateTree(state);

      // Assert
      expect(filledInState).toHaveLength(1);
      const filledIn = filledInState[0];
      expect(filledIn.inputs.b).toBe(
        (values.a ?? (filledIn.inputs.a as string)).toUpperCase()
      );
    })
  );

  test('dependent generators work when dependent value is a runtime value', () => {
    // Arrange
    const text = 'some lowercase text';
    const dependentState = createDesiredState(MockResource, { text });
    const state = [
      dependentState,
      createDesiredState(Valid, {
        a: getRuntimeResourceValue(dependentState, 'text'),
      }),
    ];

    // Act
    const filledInState = fillInDesiredStateTree(state);

    // Assert
    expect(filledInState).toHaveLength(2);
    const filledIn = filledInState.find(
      (s) => s.resource === Valid
    ) as ErasedDesiredState;
    expect(filledIn).not.toBeUndefined();
    expect(filledIn.inputs.b).toBeInstanceOf(RuntimeValue);
    const runtimeValue = filledIn.inputs.b as RuntimeValue<string>;
    expect(
      runtimeValue.evaluate({
        [dependentState.name]: {
          desiredState: dependentState,
          createdState: { text },
        },
      })
    ).toBe(text.toUpperCase());
  });

  test('dependent generators work when there are multiple layers of runtime values', () => {
    // Arrange
    const text = 'some lowercase text';
    const dependentState = createDesiredState(MockResource, { text });
    const state = [
      dependentState,
      createDesiredState(Valid, {
        a: getRuntimeResourceValue(dependentState, 'text'),
      }),
    ];

    // Act
    const filledInState = fillInDesiredStateTree(state);

    // Assert
    expect(filledInState).toHaveLength(2);
    const filledIn = filledInState.find(
      (s) => s.resource === Valid
    ) as ErasedDesiredState;
    expect(filledIn).not.toBeUndefined();
    expect(filledIn.inputs.c).toBeInstanceOf(RuntimeValue);
    const runtimeValue = filledIn.inputs.c as RuntimeValue<string>;
    expect(
      runtimeValue.evaluate({
        [dependentState.name]: {
          desiredState: dependentState,
          createdState: { text },
        },
      })
    ).toBe(`${text.split(' ')[0]}${text.length}`);
  });

  test('errors filling in values with circular reference in dependent generator', () => {
    // Arrange
    const state = [createDesiredState(Circular, {})];

    // Act & Assert
    expect(() => fillInDesiredStateTree(state)).toThrow();
  });

  test('fills in complex values', () => {
    // Arrange
    const state = [createDesiredState(Advanced, {})];

    // Act
    const filledInState = fillInDesiredStateTree(state);

    // Assert
    expect(filledInState).toHaveLength(1);
    const filledIn = filledInState[0];
    expect(filledIn.inputs.complex).toEqual(anyComplexValue);
  });

  test('fills in array values', () => {
    // Arrange
    const state = [createDesiredState(Advanced, {})];

    // Act
    const filledInState = fillInDesiredStateTree(state);

    // Assert
    expect(filledInState).toHaveLength(1);
    const filledIn = filledInState[0];
    expect(filledIn.inputs.array).toBeInstanceOf(Array);
  });

  test('fills in array of complex values', () => {
    // Arrange
    const state = [createDesiredState(Advanced, {})];

    // Act
    const filledInState = fillInDesiredStateTree(state);

    // Assert
    expect(filledInState).toHaveLength(1);
    const filledIn = filledInState[0];
    expect(filledIn.inputs.arrayOfComplex).toBeInstanceOf(Array);
  });

  test('fills in array fields on complex values', () => {
    // Arrange
    const state = [createDesiredState(Advanced, {})];

    // Act
    const filledInState = fillInDesiredStateTree(state);

    // Assert
    expect(filledInState).toHaveLength(1);
    const filledIn = filledInState[0];
    const complex: ComplexValue = filledIn.inputs.complex as any;
    expect(complex.favouriteColours).toBeInstanceOf(Array);
  });

  test('adheres to min and max array counts', () => {
    runTimes(50, () => {
      // Arrange
      const state = [createDesiredState(Advanced, {})];

      // Act
      const filledInState = fillInDesiredStateTree(state);

      // Assert
      expect(filledInState).toHaveLength(1);
      const filledIn = filledInState[0];
      const array: number[] = filledIn.inputs.array as any;
      expect(array.length).toBeGreaterThanOrEqual(minArrayCount);
      expect(array.length).toBeLessThanOrEqual(maxArrayCount);
    });
  });

  const generatorCases: [
    (values: InputValues<AdvancedInput>) => Value<number>,
    (values: InputValues<AdvancedInput>) => Value<number>,
    string
  ][] = [
    [
      (values) => values.depdendentGeneratedConstraint,
      (values) => values.dependentField,
      'depdendent generators',
    ],
    [(values) => values.generatedConstraint, () => 1, 'generators'],
  ];
  generatorCases.forEach(([accessor, expected, name]) => {
    test(`${name} constraint values are used instead of normal generation`, () => {
      // Arrange
      const state = [createDesiredState(Advanced, {})];

      // Act
      const filledInState = fillInDesiredStateTree(state);

      // Assert
      expect(filledInState).toHaveLength(1);
      const filledIn = filledInState[0];
      const inputs: InputValues<AdvancedInput> = filledIn.inputs as any;
      expect(accessor(inputs)).toBe(expected(inputs));
    });

    test(`normal generation is used when ${name} constraint returns a no value generated result`, () => {
      // Arrange
      overriddenDependentOutput = GenerationResult.ValueNotGenerated;
      overriddenStandardOutput = GenerationResult.ValueNotGenerated;
      const state = [createDesiredState(Advanced, {})];

      // Act
      const filledInState = fillInDesiredStateTree(state);

      // Assert
      expect(filledInState).toHaveLength(1);
      const filledIn = filledInState[0];
      const inputs: InputValues<AdvancedInput> = filledIn.inputs as any;
      expect(accessor(inputs)).toBe(anyGeneratedPrimative);
    });
  });

  describe('Parent constraints', () => {
    //---------------------------------
    // Helper resources
    //---------------------------------
    class GreatGrandparentInputs extends PropertiesBase {
      text: PropertyDefinition<string> = def(string());
      numbers: PropertyDefinition<number[]> = def(array(int()));
    }
    class GreatGrandparentOutputs extends GreatGrandparentInputs {
      id: PropertyDefinition<number> = def(int());
    }
    class GreatGrandparentResource extends Resource<
      GreatGrandparentInputs,
      GreatGrandparentOutputs
    > {
      constructor() {
        super(new GreatGrandparentInputs(), new GreatGrandparentOutputs());
      }
      create({
        text,
        numbers,
      }: ResolvedInputs<GreatGrandparentInputs>): Promise<
        OutputValues<GreatGrandparentOutputs>
      > {
        return Promise.resolve({
          text,
          numbers,
          id: 1,
        });
      }
    }
    const GreatGrandparent = new GreatGrandparentResource();

    class GrandparentInputs extends PropertiesBase {
      text: PropertyDefinition<string> = def(string());
      numbers: PropertyDefinition<number[]> = def(array(int()));
      parentId: PropertyDefinition<number> = def(
        getLink(GreatGrandparent, (g) => g.id)
      );
    }
    class GrandparentOutputs extends GrandparentInputs {
      id: PropertyDefinition<string> = def(string());
    }
    class GrandparentResource extends Resource<
      GrandparentInputs,
      GrandparentOutputs
    > {
      constructor() {
        super(new GrandparentInputs(), new GrandparentOutputs());
      }
      create(
        inputs: ResolvedInputs<GrandparentInputs>
      ): Promise<OutputValues<GrandparentOutputs>> {
        return Promise.resolve({
          ...inputs,
          id: '1',
        });
      }
    }
    const Grandparent = new GrandparentResource();

    class ParentInputs extends PropertiesBase {
      doNotCreateParentId: PropertyDefinition<string | undefined> = def(
        getOptionalLink(
          Grandparent,
          (g) => g.id,
          ParentCreationMode.DoNotCreate
        )
      );
      maybeCreateParentId: PropertyDefinition<string | undefined> = def(
        getOptionalLink(
          Grandparent,
          (g) => g.id,
          ParentCreationMode.MaybeCreate
        )
      );
      createParentId: PropertyDefinition<string | undefined> = def(
        getOptionalLink(Grandparent, (g) => g.id, ParentCreationMode.Create)
      );
      text: PropertyDefinition<string> = def(string());
    }
    class ParentOutputs extends ParentInputs {
      id: PropertyDefinition<number> = def(int());
    }
    class ParentResource extends Resource<ParentInputs, ParentOutputs> {
      constructor() {
        super(new ParentInputs(), new ParentOutputs());
      }
      create(
        inputs: ResolvedInputs<ParentInputs>
      ): Promise<OutputValues<ParentOutputs>> {
        return Promise.resolve({
          ...inputs,
          id: 1,
        });
      }
    }
    const Parent = new ParentResource();

    class ChildInputs extends PropertiesBase {
      constraintedTextParentId: PropertyDefinition<number | undefined> = def(
        getOptionalLink(
          Parent,
          (g) => g.id,
          ParentCreationMode.Create,
          parentConstraint(this, Parent, (c) => {
            c.setValue((p) => p.text, 'Setting value from child');
          })
        )
      );
      createGrandparentParentId: PropertyDefinition<number | undefined> = def(
        getOptionalLink(
          Parent,
          (g) => g.id,
          ParentCreationMode.Create,
          parentConstraint(this, Parent, (c) => {
            c.setValue((p) => p.maybeCreateParentId, undefined);
            c.ancestor<typeof Grandparent>(
              (p) => p.createParentId,
              ParentCreationMode.Create
            );
          })
        )
      );
      doNotCreateGrandparentParentId: PropertyDefinition<number | undefined> =
        def(
          getOptionalLink(
            Parent,
            (g) => g.id,
            ParentCreationMode.Create,
            parentConstraint(this, Parent, (c) => {
              c.setValue((p) => p.maybeCreateParentId, undefined);
              c.setValue((p) => p.createParentId, undefined);
              c.ancestor<typeof Grandparent>(
                (p) => p.createParentId,
                ParentCreationMode.DoNotCreate
              );
            })
          )
        );
      maybeCreateGrandparentParentId: PropertyDefinition<number | undefined> =
        def(
          getOptionalLink(
            Parent,
            (g) => g.id,
            ParentCreationMode.Create,
            parentConstraint(this, Parent, (c) => {
              c.setValue((p) => p.maybeCreateParentId, undefined);
              c.ancestor<typeof Grandparent>(
                (p) => p.createParentId,
                ParentCreationMode.MaybeCreate
              );
            })
          )
        );
    }
    class ChildOutputs extends ChildInputs {
      id: PropertyDefinition<number> = def(int());
    }
    class ChildResource extends Resource<ChildInputs, ChildOutputs> {
      constructor() {
        super(new ChildInputs(), new ChildOutputs());
      }
      create(
        inputs: ResolvedInputs<ChildInputs>
      ): Promise<OutputValues<ChildOutputs>> {
        return Promise.resolve({
          ...inputs,
          id: 1,
        });
      }
    }
    const Child = new ChildResource();

    //---------------------------------
    // Tests
    //---------------------------------

    test('constrains generated parent inputs', () => {
      // Arrange
      const state = [
        createDesiredState(Child, {
          createGrandparentParentId: undefined,
          doNotCreateGrandparentParentId: undefined,
          maybeCreateGrandparentParentId: undefined,
        }),
      ];

      // Act
      const filledInState = fillInDesiredStateTree(state);

      // Assert
      const parentState = filledInState.find(
        (s) => s.resource === Parent
      ) as ErasedDesiredState;
      expect(parentState).toBeDefined();
      expect(parentState.inputs.text).toEqual('Setting value from child');
    });

    describe('Create Mode', () => {
      test('always creates parents with create mode constraint', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Parent, {
              // createParentId not specified
              maybeCreateParentId: undefined,
              doNotCreateParentId: undefined,
            }),
          ];

          // Act
          const filledInState = fillInDesiredStateTree(state);

          // Assert
          const parentState = filledInState.find(
            (s) => s.resource === Grandparent
          ) as ErasedDesiredState;
          expect(parentState).toBeDefined();
        });
      });

      test('never creates parents with create mode constraint', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Parent, {
              createParentId: undefined,
              maybeCreateParentId: undefined,
              // doNotCreateParentId not specified
            }),
          ];

          // Act
          const filledInState = fillInDesiredStateTree(state);

          // Assert
          const parentState = filledInState.find(
            (s) => s.resource === Grandparent
          ) as ErasedDesiredState;
          expect(parentState).toBeUndefined();
        });
      });

      test('sometimes creates parents with maybe create mode constraint', () => {
        // Arrange
        let created = false;
        let notCreated = false;
        runTimes(30, () => {
          const state = [
            createDesiredState(Parent, {
              createParentId: undefined,
              // maybeCreateParentId not specified
              doNotCreateParentId: undefined,
            }),
          ];

          // Act
          const filledInState = fillInDesiredStateTree(state);

          const parentState = filledInState.find(
            (s) => s.resource === Grandparent
          ) as ErasedDesiredState;
          if (parentState) {
            created = true;
          } else {
            notCreated = true;
          }
        });

        // Assert
        expect(created).toBe(true);
        expect(notCreated).toBe(true);
      });

      test('does not create parent with explicit undefined value when parent has create mode constraint', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Parent, {
              createParentId: undefined,
              maybeCreateParentId: undefined,
              doNotCreateParentId: undefined,
            }),
          ];

          // Act
          const filledInState = fillInDesiredStateTree(state);

          // Assert
          const parentState = filledInState.find(
            (s) => s.resource === Grandparent
          ) as ErasedDesiredState;
          expect(parentState).toBeUndefined();
        });
      });

      test('always creates grandparents when has create mode constraint', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Child, {
              constraintedTextParentId: undefined,
              // createGrandparentParentId not specified
              doNotCreateGrandparentParentId: undefined,
              maybeCreateGrandparentParentId: undefined,
            }),
          ];

          // Act
          const filledInState = fillInDesiredStateTree(state);

          // Assert
          const parentState = filledInState.find(
            (s) => s.resource === Grandparent
          ) as ErasedDesiredState;
          expect(parentState).toBeDefined();
        });
      });

      test('maybe creates grandparents when has maybe create mode constraint', () => {
        // Arrange
        let created = false;
        let notCreated = false;
        runTimes(20, () => {
          const state = [
            createDesiredState(Child, {
              constraintedTextParentId: undefined,
              createGrandparentParentId: undefined,
              doNotCreateGrandparentParentId: undefined,
              // maybeCreateGrandparentParentId not specified
            }),
          ];

          // Act
          const filledInState = fillInDesiredStateTree(state);

          const parentState = filledInState.find(
            (s) => s.resource === Grandparent
          ) as ErasedDesiredState;
          if (parentState) {
            created = true;
          } else {
            notCreated = true;
          }
        });

        // Assert
        expect(created).toBe(true);
        expect(notCreated).toBe(true);
      });
    });

    test('does not create grandparent when has do not create mode constraint', () => {
      runTimes(20, () => {
        // Arrange
        const state = [
          createDesiredState(Child, {
            constraintedTextParentId: undefined,
            createGrandparentParentId: undefined,
            // doNotCreateGrandparentParentId not specified
            maybeCreateGrandparentParentId: undefined,
          }),
        ];

        // Act
        const filledInState = fillInDesiredStateTree(state);

        // Assert
        const parentState = filledInState.find(
          (s) => s.resource === Grandparent
        ) as ErasedDesiredState;
        expect(parentState).toBeUndefined();
      });
    });
  });
});
