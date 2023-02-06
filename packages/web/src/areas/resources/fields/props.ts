interface InputContext {
  rootInputName: string;
  desiredResourceId: string;
}

export interface BaseInputProps {
  name: string;
  nullable: boolean;
  undefinable: boolean;
  context: InputContext;
}
