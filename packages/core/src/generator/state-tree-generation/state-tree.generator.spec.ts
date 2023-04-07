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
  ResolvedValues,
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
import type { Value } from '../../resources/properties/properties';
import { ErasedDesiredState } from '../../resources/desired-state';
import {
  getRuntimeResourceValue,
  mapValue,
  mapValues,
  RuntimeValue,
} from '../../resources/runtime-values';
import {
  constrainAll,
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
  nestedArrays: PropertyDefinition<number[][]> = def(
    array(
      array(int(), {
        minItems: minArrayCount,
        maxItems: maxArrayCount,
      }),
      {
        minItems: minArrayCount,
        maxItems: maxArrayCount,
      }
    )
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

  test('fills in array of array of values', () => {
    // Arrange
    const state = [createDesiredState(Advanced, {})];

    // Act
    const filledInState = fillInDesiredStateTree(state);

    // Assert
    expect(filledInState).toHaveLength(1);
    const filledIn = filledInState[0];
    expect(filledIn.inputs.nestedArrays).toBeInstanceOf(Array);
    const nestedArrays = filledIn.inputs.nestedArrays as number[][];
    expect(nestedArrays[0]).toBeInstanceOf(Array);
    expect(nestedArrays[0][0]).toBe(anyGeneratedPrimative);
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
      }: ResolvedValues<GreatGrandparentInputs>): Promise<
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
      numbers: PropertyDefinition<number[]> = def(
        array(int(), { minItems: 10, maxItems: 10 })
      );
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
        inputs: ResolvedValues<GrandparentInputs>
      ): Promise<OutputValues<GrandparentOutputs>> {
        return Promise.resolve({
          ...inputs,
          id: '1',
        });
      }
    }
    const Grandparent = new GrandparentResource();

    class ParentInputs extends PropertiesBase {
      constrainAllInList: PropertyDefinition<number | undefined> = def(
        getOptionalLink(
          Grandparent,
          (p) => p.id,
          ParentCreationMode.Create,
          parentConstraint(this, Grandparent, (c) => {
            c.setValue((p) => constrainAll(p.numbers), 87);
          })
        )
      );
      constrainIndexInList: PropertyDefinition<number | undefined> = def(
        getOptionalLink(
          Grandparent,
          (p) => p.id,
          ParentCreationMode.Create,
          parentConstraint(this, Grandparent, (c) => {
            c.setValue((p) => p.numbers[4], 154);
          })
        )
      );
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
      requiredParentId: PropertyDefinition<string> = def(
        getLink(Grandparent, (g) => g.id)
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
        inputs: ResolvedValues<ParentInputs>
      ): Promise<OutputValues<ParentOutputs>> {
        return Promise.resolve({
          ...inputs,
          id: 1,
        });
      }
    }
    const Parent = new ParentResource();

    class ChildInputs extends PropertiesBase {
      constrainedFieldsParentId: PropertyDefinition<number | undefined> = def(
        getOptionalLink(
          Parent,
          (g) => g.id,
          ParentCreationMode.Create,
          parentConstraint(this, Parent, (c) => {
            c.setValue((p) => p.text, 'Setting value from child');

            c.setValue((p) => p.doNotCreateParentId, undefined);
            c.setValue((p) => p.maybeCreateParentId, undefined);
            c.setValue((p) => p.requiredParentId, undefined);
            c.setValue((p) => p.constrainAllInList, undefined);
            c.setValue((p) => p.constrainIndexInList, undefined);

            const gc = c.ancestor<typeof Grandparent>(
              (c) => c.createParentId,
              ParentCreationMode.Create
            );

            gc.setValue((gp) => gp.text, 'Setting value from child');
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
            c.setValue((p) => p.requiredParentId, undefined);
            c.setValue((p) => p.constrainAllInList, undefined);
            c.setValue((p) => p.constrainIndexInList, undefined);
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
              c.setValue((p) => p.requiredParentId, undefined);
              c.setValue((p) => p.constrainAllInList, undefined);
              c.setValue((p) => p.constrainIndexInList, undefined);
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
              c.setValue((p) => p.requiredParentId, undefined);
              c.setValue((p) => p.constrainAllInList, undefined);
              c.setValue((p) => p.constrainIndexInList, undefined);
              c.ancestor<typeof Grandparent>(
                (p) => p.createParentId,
                ParentCreationMode.MaybeCreate
              );
            })
          )
        );
      requiredParentId: PropertyDefinition<number> = def(
        getLink(Parent, (g) => g.id)
      );
      parents: PropertyDefinition<{ parentId: number }[]> = def(
        array(
          complex<{ parentId: number }>({
            parentId: getLink(
              Parent,
              (p) => p.id,
              parentConstraint(this, Parent, (c) => {
                c.setValue((p) => p.doNotCreateParentId, undefined);
                c.setValue((p) => p.maybeCreateParentId, undefined);
                c.setValue((p) => p.requiredParentId, undefined);
                c.setValue((p) => p.constrainAllInList, undefined);
                c.setValue((p) => p.constrainIndexInList, undefined);
                const gc = c.ancestor<typeof Grandparent>(
                  (p) => p.createParentId,
                  ParentCreationMode.Create
                );

                gc.setValue(
                  (g) => g.text,
                  'Setting grandparent value through list'
                );

                const ggc = gc.ancestor<typeof GreatGrandparent>(
                  (g) => g.parentId
                );

                ggc.setValue(
                  (ggp) => ggp.text,
                  'Setting great grand parent from child'
                );
              })
            ),
          }),
          { minItems: 1, maxItems: 1 }
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
        inputs: ResolvedValues<ChildInputs>
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

    describe('Constraining fields', () => {
      test('constrains generated parent inputs', () => {
        // Arrange
        const state = [
          createDesiredState(Child, {
            createGrandparentParentId: undefined,
            doNotCreateGrandparentParentId: undefined,
            maybeCreateGrandparentParentId: undefined,
            requiredParentId: undefined,
            parents: [],
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

      test('constrains grandparent inputs', () => {
        // Arrange
        const state = [
          createDesiredState(Child, {
            createGrandparentParentId: undefined,
            doNotCreateGrandparentParentId: undefined,
            maybeCreateGrandparentParentId: undefined,
            requiredParentId: undefined,
            parents: [],
          }),
        ];

        // Act
        const filledInState = fillInDesiredStateTree(state);

        // Assert
        const parentState = filledInState.find(
          (s) => s.resource === Grandparent
        ) as ErasedDesiredState;
        expect(parentState).toBeDefined();
        expect(parentState.inputs.text).toEqual('Setting value from child');
      });

      test('constrains all list items with constrain all helper', () => {
        // Arrange
        const state = [
          createDesiredState(Parent, {
            // constrainAllInList not specified
            constrainIndexInList: undefined,
            maybeCreateParentId: undefined,
            createParentId: undefined,
            doNotCreateParentId: undefined,
            requiredParentId: undefined,
          }),
        ];

        // Act
        const filledInState = fillInDesiredStateTree(state);

        // Assert
        const parentState = filledInState.find(
          (s) => s.resource === Grandparent
        ) as ErasedDesiredState;
        expect(parentState.inputs.numbers).toEqual([
          ...Array.from(new Array(10).keys()).map(() => 87),
        ]);
      });

      test('constrains specified index with specific index in constraint', () => {
        // Arrange
        const state = [
          createDesiredState(Parent, {
            constrainAllInList: undefined,
            //constrainIndexInList not specified
            maybeCreateParentId: undefined,
            createParentId: undefined,
            doNotCreateParentId: undefined,
            requiredParentId: undefined,
          }),
        ];

        // Act
        const filledInState = fillInDesiredStateTree(state);

        // Assert
        const parentState = filledInState.find(
          (s) => s.resource === Grandparent
        ) as ErasedDesiredState;
        expect((parentState.inputs.numbers as number[])[4]).toBe(154);
        expect(
          (parentState.inputs.numbers as number[]).filter((n) => n !== 154)
            .length
        ).toBeGreaterThan(0);
      });

      test('constrains items through list of parent ids', () => {
        // Arrange
        const state = [
          createDesiredState(Child, {
            constrainedFieldsParentId: undefined,
            createGrandparentParentId: undefined,
            doNotCreateGrandparentParentId: undefined,
            maybeCreateGrandparentParentId: undefined,
            // parents not specified
            requiredParentId: undefined,
          }),
        ];

        // Act
        const filledInState = fillInDesiredStateTree(state);

        // Assert
        const parentState = filledInState.find(
          (s) => s.resource === Grandparent
        ) as ErasedDesiredState;
        expect(parentState.inputs.text).toBe(
          'Setting grandparent value through list'
        );
      });

      test('can constraint in long chain of parents', () => {
        // Arrange
        const state = [
          createDesiredState(Child, {
            constrainedFieldsParentId: undefined,
            createGrandparentParentId: undefined,
            doNotCreateGrandparentParentId: undefined,
            maybeCreateGrandparentParentId: undefined,
            // parents not specified
            requiredParentId: undefined,
          }),
        ];

        // Act
        const filledInState = fillInDesiredStateTree(state);

        // Assert
        const parentState = filledInState.find(
          (s) => s.resource === GreatGrandparent
        ) as ErasedDesiredState;
        expect(parentState.inputs.text).toBe(
          'Setting great grand parent from child'
        );
      });
    });

    describe('Create Mode', () => {
      test('always creates parents with create mode constraint', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Parent, {
              // createParentId not specified
              constrainAllInList: undefined,
              constrainIndexInList: undefined,
              maybeCreateParentId: undefined,
              doNotCreateParentId: undefined,
              requiredParentId: undefined,
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
              constrainAllInList: undefined,
              constrainIndexInList: undefined,
              createParentId: undefined,
              maybeCreateParentId: undefined,
              // doNotCreateParentId not specified
              requiredParentId: undefined,
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
              constrainAllInList: undefined,
              constrainIndexInList: undefined,
              createParentId: undefined,
              // maybeCreateParentId not specified
              doNotCreateParentId: undefined,
              requiredParentId: undefined,
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
              constrainAllInList: undefined,
              constrainIndexInList: undefined,
              createParentId: undefined,
              maybeCreateParentId: undefined,
              doNotCreateParentId: undefined,
              requiredParentId: undefined,
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

      test('always creates parents when link is not optional', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Parent, {
              constrainAllInList: undefined,
              constrainIndexInList: undefined,
              createParentId: undefined,
              maybeCreateParentId: undefined,
              doNotCreateParentId: undefined,
              // requiredParentId not specified
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

      test('always creates grandparents when has create mode constraint', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Child, {
              constrainedFieldsParentId: undefined,
              // createGrandparentParentId not specified
              doNotCreateGrandparentParentId: undefined,
              maybeCreateGrandparentParentId: undefined,
              requiredParentId: undefined,
              parents: [],
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
              constrainedFieldsParentId: undefined,
              createGrandparentParentId: undefined,
              doNotCreateGrandparentParentId: undefined,
              // maybeCreateGrandparentParentId not specified
              requiredParentId: undefined,
              parents: [],
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

      test('does not create grandparent when has do not create mode constraint', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Child, {
              constrainedFieldsParentId: undefined,
              createGrandparentParentId: undefined,
              // doNotCreateGrandparentParentId not specified
              maybeCreateGrandparentParentId: undefined,
              requiredParentId: undefined,
              parents: [],
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

      test('always creates grandparent when link is not optional', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Child, {
              constrainedFieldsParentId: undefined,
              createGrandparentParentId: undefined,
              doNotCreateGrandparentParentId: undefined,
              maybeCreateGrandparentParentId: undefined,
              // requiredParentId not specified
              parents: [],
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

      test('applies constraint for grandparent through links in lists', () => {
        runTimes(20, () => {
          // Arrange
          const state = [
            createDesiredState(Child, {
              constrainedFieldsParentId: undefined,
              createGrandparentParentId: undefined,
              doNotCreateGrandparentParentId: undefined,
              maybeCreateGrandparentParentId: undefined,
              requiredParentId: undefined,
              // parents not specified
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
    });

    test('creates parents for links in arrays and complex objects', () => {
      // Arrange
      const state = [
        createDesiredState(Child, {
          constrainedFieldsParentId: undefined,
          createGrandparentParentId: undefined,
          doNotCreateGrandparentParentId: undefined,
          maybeCreateGrandparentParentId: undefined,
          requiredParentId: undefined,
          // parentIds not specified
        }),
      ];

      // Act
      const filledInState = fillInDesiredStateTree(state);

      // Assert
      const parentState = filledInState.find(
        (s) => s.resource === Parent
      ) as ErasedDesiredState;
      expect(parentState).toBeDefined();
    });
  });
});
