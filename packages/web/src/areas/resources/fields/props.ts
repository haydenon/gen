interface InputContext {
  rootInputName: string;
  desiredResourceId: number;
}

export interface BaseInputProps {
  name: string;
  nullable: boolean;
  undefinable: boolean;
  context: InputContext;
}
