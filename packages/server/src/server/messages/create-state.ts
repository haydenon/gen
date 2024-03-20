import {
  ClientMessageBase,
  ServerMessageBase,
  ServerMessageType,
} from '../gen-server';
import { StateRequest } from '../models/state-requests';
import {
  CreatedStateItem,
  DesiredStateItem,
  StateCreateResponse,
} from '../models/state-responses';

export enum CreateStateClientTypes {
  CreateState = 'CreateState',
}

export interface CreateStateMessage extends ClientMessageBase {
  type: CreateStateClientTypes.CreateState;
  body: StateRequest;
  environment: string;
}

export const enum CreateStateServerTypes {
  StateCreationPlanned = 'StatePlanned',
  ResourceCreateStarting = 'ResourceCreateStarting',
  ResourceCreateFinished = 'ResourceCreateFinished',
  ResourceCreateErrored = 'ResourceCreateErrored',
  StateCreationFinished = 'StateCreationFinished',
  StateCreationErrored = 'StateCreationErrored',
}

export interface StateCreationPlannedMessage extends ServerMessageBase {
  type: CreateStateServerTypes.StateCreationPlanned;
  desiredState: DesiredStateItem[];
}
export interface ResourceCreateStartingMessage extends ServerMessageBase {
  type: CreateStateServerTypes.ResourceCreateStarting;
  desiredState: DesiredStateItem;
}
export interface ResourceCreateFinishedMessage extends ServerMessageBase {
  type: CreateStateServerTypes.ResourceCreateFinished;
  createdState: CreatedStateItem;
}
export interface ResourceCreateErroredMessage extends ServerMessageBase {
  type: CreateStateServerTypes.ResourceCreateErrored;
  desiredState: DesiredStateItem;
  error: string;
}
export interface StateCreationFinishedMessage extends ServerMessageBase {
  type: CreateStateServerTypes.StateCreationFinished;
  result: StateCreateResponse;
}
export interface StateCreationErroredMessage extends ServerMessageBase {
  type: CreateStateServerTypes.StateCreationErrored;
  errors: string[];
}

export type CreateServerMessage =
  | StateCreationPlannedMessage
  | ResourceCreateStartingMessage
  | ResourceCreateFinishedMessage
  | ResourceCreateErroredMessage
  | StateCreationFinishedMessage
  | StateCreationErroredMessage;

export interface ErrorMessage {
  errors: { message: string }[];
}
