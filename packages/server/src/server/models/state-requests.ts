export interface StateItem {
  _type: string;
  _name?: string;
  _dependentOnStateNames?: string[];
}

export interface StateRequest {
  state: StateItem[];
}

export const isStateItem = (item: any): item is StateItem =>
  typeof item === 'object' &&
  typeof item._type === 'string' &&
  ['string', 'undefined'].includes(typeof item._name) &&
  (['undefined'].includes(typeof item._dependentOnStateNames) ||
   (Array.isArray(item._dependentOnStateNames) &&
    item._dependentOnStateNames.every((n: any) => typeof n === 'string')));

export const isStateRequest = (body: any): body is StateRequest =>
  typeof body === 'object' &&
  body.state instanceof Array &&
  body.state.every(isStateItem);
