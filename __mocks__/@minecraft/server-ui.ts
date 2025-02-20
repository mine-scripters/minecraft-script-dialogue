import type * as MC from "@minecraft/server-ui";
import { createMockedClass } from "../../scripts/script_dialogue/test/mock-helpers";

// Copied from '@minecraft/server-ui';
export enum FormCancelationReason {
  UserBusy = 'UserBusy',
  UserClosed = 'UserClosed',
}

export enum FormRejectReason {
  MalformedResponse = 'MalformedResponse',
  PlayerQuit = 'PlayerQuit',
  ServerShutdown = 'ServerShutdown',
}

export const ActionFormData : jest.MockedClass<any> = jest.fn(() => createMockedClass<MC.ActionFormData>(ActionFormData, {
  body: jest.fn(),
  button: jest.fn(),
  show: jest.fn(async () => new ActionFormResponse()),
  title: jest.fn()
}));

export const ActionFormResponse : jest.MockedClass<any>=  jest.fn(() => createMockedClass<MC.ActionFormResponse>(ActionFormResponse, {
  selection: 0,
  canceled: false,
  cancelationReason: undefined,
}));
export const FormResponse : jest.MockedClass<any> =  jest.fn(() => createMockedClass<MC.FormResponse>(FormResponse, {
  canceled: true,
  cancelationReason: FormCancelationReason.UserBusy
}));
export const MessageFormData: jest.MockedClass<any> =  jest.fn(() => createMockedClass<MC.MessageFormData>(MessageFormData, {
  body: jest.fn(),
  button1: jest.fn(),
  button2: jest.fn(),
  show: jest.fn(async () => new MessageFormResponse()),
  title: jest.fn(),
}));
export const MessageFormResponse: jest.MockedClass<any> =  jest.fn(() => createMockedClass<MC.MessageFormResponse>(MessageFormResponse, {
  selection: 0,
  cancelationReason: undefined,
  canceled: false
}));
export const ModalFormData: jest.MockedClass<any> =  jest.fn(() => createMockedClass<MC.ModalFormData>(ModalFormData,{
  dropdown: jest.fn(),
  show: jest.fn(async () => new ModalFormResponse()),
  slider: jest.fn(),
  textField: jest.fn(),
  title: jest.fn(),
  toggle: jest.fn(),
  submitButton: jest.fn(),
}));
export const ModalFormResponse: jest.MockedClass<any> =  jest.fn(() => createMockedClass<MC. ModalFormResponse>(ModalFormResponse, {
  formValues: [],
  cancelationReason: undefined,
  canceled: false
}));

export const FormRejectError: jest.MockedClass<any> = jest.fn(() =>
  createMockedClass<MC.FormRejectError>(FormRejectError, {
  name: "FormRejectError",
  message: "Form was rejected because of an error",
  reason: FormRejectReason.MalformedResponse
}));
