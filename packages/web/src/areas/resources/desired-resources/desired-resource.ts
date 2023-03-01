export interface DesiredResource {
  id: string;
  type?: string;
  name?: string;
  fieldData: { [property: string]: any };
}

export enum ErrorPathType {
  Root,
  Field,
}

export interface DesiredStateFormError {
  resourceId: string;
  error: Error;
  errorCategory: string;
  pathType: ErrorPathType;
  path: string[];
}
