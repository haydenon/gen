import { DesiredStateFormError } from '../desired-resources/desired-resource';

export interface InputContext {
  rootInputName: string;
  desiredResourceId: string;
  currentPath: string[];
}

export interface BaseInputProps {
  name: string | null;
  context: InputContext;
  parentActions: React.ReactNode | React.ReactNode[];
  errors: DesiredStateFormError[];
}
