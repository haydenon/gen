export interface StateItem {
  _type: string;
  _name?: string;
}

export interface StateRequest {
  state: StateItem[];
}

export const isStateItem = (item: any): item is StateItem =>
  typeof item === 'object' &&
  typeof item._type === 'string' &&
  ['string', 'undefined'].includes(typeof item._name);

export const isStateRequest = (body: any): body is StateRequest =>
  typeof body === 'object' &&
  body.state instanceof Array &&
  body.state.every(isStateItem);
