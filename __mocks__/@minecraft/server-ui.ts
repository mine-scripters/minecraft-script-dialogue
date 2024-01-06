import type * as MC from "@minecraft/server-ui";

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

export const ActionFormData = jest.fn((): MC.ActionFormData => ({
  body: jest.fn(),
  button: jest.fn(),
  show: jest.fn(async () => new ActionFormResponse()),
  title: jest.fn()
}));
export const ActionFormResponse=  jest.fn((): MC.ActionFormResponse => ({
  selection: 0,
  canceled: false,
  cancelationReason: undefined,
}));
export const FormResponse=  jest.fn((): MC.FormResponse => ({
  canceled: true,
  cancelationReason: FormCancelationReason.UserBusy
}));
export const MessageFormData =  jest.fn((): MC.MessageFormData => ({
  body: jest.fn(),
  button1: jest.fn(),
  button2: jest.fn(),
  show: jest.fn(async () => new MessageFormResponse()),
  title: jest.fn(),
}));
export const MessageFormResponse=  jest.fn((): MC.MessageFormResponse => ({
  selection: 0,
  cancelationReason: undefined,
  canceled: false
}));
export const ModalFormData=  jest.fn((): MC.ModalFormData => ({
  dropdown: jest.fn(),
  show: jest.fn(async () => new ModalFormResponse()),
  slider: jest.fn(),
  textField: jest.fn(),
  title: jest.fn(),
  toggle: jest.fn()
}));
export const ModalFormResponse=  jest.fn((): MC. ModalFormResponse => ({
  formValues: [],
  cancelationReason: undefined,
  canceled: false
}));
export const FormRejectError=  jest.fn((): MC.FormRejectError => ({
  name: "FormRejectError",
  message: "Form was rejected because of an error",
  reason: FormRejectReason.MalformedResponse
}));
