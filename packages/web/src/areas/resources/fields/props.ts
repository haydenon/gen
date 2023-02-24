interface InputContext {
  rootInputName: string;
  desiredResourceId: string;
}

export interface BaseInputProps {
  name: string | null;
  context: InputContext;
  parentActions: React.ReactNode | React.ReactNode[];
}
