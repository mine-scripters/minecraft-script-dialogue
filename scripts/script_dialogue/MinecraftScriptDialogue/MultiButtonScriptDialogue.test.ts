import { multiButtonScriptDialogue } from './MultiButtonScriptDialogue';
import {
  ActionFormData,
  ActionFormResponse,
  FormCancelationReason,
  FormRejectReason,
  FormRejectError,
} from '@minecraft/server-ui';
import { ButtonDialogueResponse, DialogueCanceledResponse, DialogueRejectedResponse } from './ScriptDialogue';
import { mockPlayer } from '../test/server-utils';
import { newMockedInstance } from '../test/mock-helpers';

const TITLE = 'my.title';
const BODY = 'hello-world';

const BUTTON1 = Object.freeze({
  NAME: 'button-01',
  TEXT: 'my-button-01-text',
  ICON: 'icon/button01',
});

const BUTTON2 = Object.freeze({
  NAME: 'button-02',
  TEXT: 'my-button-02-text',
  ICON: undefined,
});

const createMultiButtonScriptDialogue = () => {
  return multiButtonScriptDialogue(TITLE)
    .addButton(BUTTON1.NAME, BUTTON1.TEXT, BUTTON1.ICON)
    .addButton(BUTTON2.NAME, BUTTON2.TEXT, BUTTON2.ICON);
};

describe('MultiButtonScriptDialogue', () => {
  it('Title, 2 button and no body', async () => {
    const player = mockPlayer();

    await createMultiButtonScriptDialogue().open({ player });

    expect(ActionFormData).toHaveBeenCalledTimes(1);

    const instance = jest.mocked(ActionFormData).mock.results[0].value as ActionFormData;

    expect(instance.title).toHaveBeenCalledWith(TITLE);
    expect(instance.body).not.toHaveBeenCalled();
    expect(instance.button).toHaveBeenCalledTimes(2);
    expect(instance.button).toHaveBeenNthCalledWith(1, BUTTON1.TEXT, BUTTON1.ICON);
    expect(instance.button).toHaveBeenNthCalledWith(2, BUTTON2.TEXT, BUTTON2.ICON);

    expect(instance.show).toHaveBeenCalledWith(player);
  });

  it('Title, 2 button and body', async () => {
    const player = mockPlayer();

    await createMultiButtonScriptDialogue().setBody(BODY).open({ player });

    expect(ActionFormData).toHaveBeenCalledTimes(1);

    const instance = jest.mocked(ActionFormData).mock.results[0].value as ActionFormData;

    expect(instance.title).toHaveBeenCalledWith(TITLE);
    expect(instance.body).toHaveBeenCalledWith(BODY);
    expect(instance.button).toHaveBeenCalledTimes(2);
    expect(instance.button).toHaveBeenNthCalledWith(1, BUTTON1.TEXT, BUTTON1.ICON);
    expect(instance.button).toHaveBeenNthCalledWith(2, BUTTON2.TEXT, BUTTON2.ICON);

    expect(instance.show).toHaveBeenCalledWith(player);
  });

  it('Can add multiple buttons at once', async () => {
    const player = mockPlayer();

    await createMultiButtonScriptDialogue()
      .addButtons([
        {
          text: 'button-3.text',
          name: 'button-3.name',
          iconPath: 'button-3.icon',
        },
        {
          text: 'button-4.text',
          name: 'button-4.name',
          iconPath: undefined,
        },
      ])
      .open({ player });

    expect(ActionFormData).toHaveBeenCalledTimes(1);

    const instance = jest.mocked(ActionFormData).mock.results[0].value as ActionFormData;

    expect(instance.title).toHaveBeenCalledWith(TITLE);
    expect(instance.body).not.toHaveBeenCalled();
    expect(instance.button).toHaveBeenCalledTimes(4);
    expect(instance.button).toHaveBeenNthCalledWith(1, BUTTON1.TEXT, BUTTON1.ICON);
    expect(instance.button).toHaveBeenNthCalledWith(2, BUTTON2.TEXT, BUTTON2.ICON);
    expect(instance.button).toHaveBeenNthCalledWith(3, 'button-3.text', 'button-3.icon');
    expect(instance.button).toHaveBeenNthCalledWith(4, 'button-4.text', undefined);

    expect(instance.show).toHaveBeenCalledWith(player);
  });

  it('Button 0 gets the first button', async () => {
    const player = mockPlayer();

    jest.mocked<() => ActionFormResponse>(ActionFormResponse as any).mockReturnValue({
      selection: 0,
      canceled: false,
    });

    const response = await createMultiButtonScriptDialogue().open({ player });

    expect(ActionFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(ButtonDialogueResponse);
    expect((response as ButtonDialogueResponse<string>).selected).toBe(BUTTON1.NAME);
  });

  it('Button 1 gets the second button', async () => {
    const player = mockPlayer();

    jest.mocked<() => ActionFormResponse>(ActionFormResponse as any).mockReturnValue({
      selection: 1,
      canceled: false,
    });

    const response = await createMultiButtonScriptDialogue().open({ player });

    expect(ActionFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(ButtonDialogueResponse);
    expect((response as ButtonDialogueResponse<string>).selected).toBe(BUTTON2.NAME);
  });

  it('Button 2 gets a third button', async () => {
    const player = mockPlayer();

    jest.mocked<() => ActionFormResponse>(ActionFormResponse as any).mockReturnValue({
      selection: 2,
      canceled: false,
    });

    const response = await createMultiButtonScriptDialogue().addButton('b3', 'b3').open({ player });

    expect(ActionFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(ButtonDialogueResponse);
    expect((response as ButtonDialogueResponse<string>).selected).toBe('b3');
  });

  it('Test canceled dialogue', async () => {
    const player = mockPlayer();
    jest.mocked<() => ActionFormResponse>(ActionFormResponse as any).mockReturnValue({
      canceled: true,
      cancelationReason: FormCancelationReason.UserBusy,
    });

    const response = await createMultiButtonScriptDialogue().open({ player });

    expect(ActionFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(DialogueCanceledResponse);
    expect((response as DialogueCanceledResponse).reason).toBe(FormCancelationReason.UserBusy);
  });

  it('Test rejected dialogue', async () => {
    const player = mockPlayer();
    jest.mocked<() => ActionFormResponse>(ActionFormResponse as any).mockImplementation(() => {
      throw newMockedInstance(FormRejectError);
    });

    const response = await createMultiButtonScriptDialogue().open({ player });

    expect(ActionFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(DialogueRejectedResponse);
    expect((response as DialogueCanceledResponse).reason).toBe(FormRejectReason.MalformedResponse);
  });

  it('call callback on button press', async () => {
    const player = mockPlayer();
    const callback = jest.fn();

    jest.mocked<() => ActionFormResponse>(ActionFormResponse as any).mockReturnValue({
      selection: 0,
      canceled: false,
    });

    await multiButtonScriptDialogue(TITLE)
      .addButton(BUTTON1.NAME, BUTTON1.TEXT, BUTTON1.ICON, callback)
      .addButton(BUTTON2.NAME, BUTTON2.TEXT, BUTTON2.ICON)
      .open({ player });

    expect(callback).toHaveBeenCalledWith('button-01');
  });

  it('does not call others callback on button press', async () => {
    const player = mockPlayer();
    const callback = jest.fn();

    jest.mocked<() => ActionFormResponse>(ActionFormResponse as any).mockReturnValue({
      selection: 1,
      canceled: false,
    });

    await multiButtonScriptDialogue(TITLE)
      .addButton(BUTTON1.NAME, BUTTON1.TEXT, BUTTON1.ICON, callback)
      .addButton(BUTTON2.NAME, BUTTON2.TEXT, BUTTON2.ICON)
      .open({ player });

    expect(callback).not.toHaveBeenCalled();
  });
});
