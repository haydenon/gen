import {
  ClientMessageBase,
  ClientMessageType,
  ServerMessageBase,
  ServerMessageType,
} from '../gen-server';
import { StateRequest } from '../models/state-requests';
import {
  CreatedStateItem,
  DesiredStateItem,
  StateCreateResponse,
} from '../models/state-responses';

export interface CreateStateMessage extends ClientMessageBase {
  type: ClientMessageType.CreateState;
  body: StateRequest;
}

export interface StateCreationPlannedMessage extends ServerMessageBase {
  type: ServerMessageType.StateCreationPlanned;
  desiredState: DesiredStateItem[];
}
export interface ResourceCreateStartingMessage extends ServerMessageBase {
  type: ServerMessageType.ResourceCreateStarting;
  desiredState: DesiredStateItem;
}
export interface ResourceCreateFinishedMessage extends ServerMessageBase {
  type: ServerMessageType.ResourceCreateFinished;
  createdState: CreatedStateItem;
}
export interface ResourceCreateErroredMessage extends ServerMessageBase {
  type: ServerMessageType.ResourceCreateErrored;
  desiredState: DesiredStateItem;
  error: string;
}
export interface StateCreationFinishedMessage extends ServerMessageBase {
  type: ServerMessageType.StateCreationFinished;
  result: StateCreateResponse;
}
export interface StateCreationErroredMessage extends ServerMessageBase {
  type: ServerMessageType.StateCreationErrored;
  errors: string[];
}

export type CreateServerMessage =
  | StateCreationPlannedMessage
  | ResourceCreateStartingMessage
  | ResourceCreateFinishedMessage
  | ResourceCreateErroredMessage
  | StateCreationFinishedMessage
  | StateCreationErroredMessage;
