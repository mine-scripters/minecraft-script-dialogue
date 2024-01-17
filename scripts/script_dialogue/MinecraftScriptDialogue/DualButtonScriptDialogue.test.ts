import { dualButtonScriptDialogue } from './DualButtonScriptDialogue';
import {
  FormCancelationReason,
  FormRejectReason,
  MessageFormData,
  MessageFormResponse,
  FormRejectError,
} from '@minecraft/server-ui';
import { ButtonDialogueResponse, DialogueCanceledResponse, DialogueRejectedResponse } from './ScriptDialogue';
import { mockPlayer } from '../test/server-utils';
import { newMockedInstance } from '../test/mock-helpers';

const createDualButtonScriptDialogue = () => {
  return dualButtonScriptDialogue(
    'my.title',
    {
      name: 'my-top-button',
      text: 'my.top.button.text',
    },
    {
      name: 'my-bottom-button',
      text: 'my.bottom.button.text',
    }
  );
};

describe('DualButtonScriptDialogue', () => {
  it('Without body', async () => {
    const player = mockPlayer();

    await createDualButtonScriptDialogue().open({ player });

    expect(MessageFormData).toHaveBeenCalledTimes(1);

    const instance = jest.mocked(MessageFormData).mock.results[0].value;

    expect(instance.body).not.toHaveBeenCalled();
    expect(instance.button1).toHaveBeenCalledWith('my.bottom.button.text');
    expect(instance.button2).toHaveBeenCalledWith('my.top.button.text');
    expect(instance.title).toHaveBeenCalledWith('my.title');
    expect(instance.show).toHaveBeenCalledWith(player);
  });

  it('With body', async () => {
    const player = mockPlayer();

    await createDualButtonScriptDialogue().setBody('this-is-it').open({ player });

    expect(MessageFormData).toHaveBeenCalledTimes(1);

    const instance = jest.mocked(MessageFormData).mock.results[0].value;

    expect(instance.body).toHaveBeenCalledWith('this-is-it');
    expect(instance.button1).toHaveBeenCalledWith('my.bottom.button.text');
    expect(instance.button2).toHaveBeenCalledWith('my.top.button.text');
    expect(instance.title).toHaveBeenCalledWith('my.title');
    expect(instance.show).toHaveBeenCalledWith(player);
  });

  it('Button 0 gets the bottom button', async () => {
    const player = mockPlayer();

    jest.mocked<() => MessageFormResponse>(MessageFormResponse as any).mockReturnValue({
      selection: 0,
      canceled: false,
    });

    const response = await createDualButtonScriptDialogue().open({ player });

    expect(MessageFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(ButtonDialogueResponse);
    expect((response as any).selected).toBe('my-bottom-button');
  });

  it('Button 1 gets the top button', async () => {
    const player = mockPlayer();
    jest.mocked<() => MessageFormResponse>(MessageFormResponse as any).mockReturnValue({
      selection: 1,
      canceled: false,
    });

    const response = await createDualButtonScriptDialogue().open({ player });

    expect(MessageFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(ButtonDialogueResponse);
    expect((response as any).selected).toBe('my-top-button');
  });

  it('Test canceled dialogue', async () => {
    const player = mockPlayer();
    jest.mocked<() => MessageFormResponse>(MessageFormResponse as any).mockReturnValue({
      canceled: true,
      cancelationReason: FormCancelationReason.UserBusy,
    });

    const response = await createDualButtonScriptDialogue().open({ player });

    expect(MessageFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(DialogueCanceledResponse);
    expect((response as DialogueCanceledResponse).reason).toBe(FormCancelationReason.UserBusy);
  });

  it('Test rejected dialogue', async () => {
    const player = mockPlayer();
    jest.mocked<() => MessageFormResponse>(MessageFormResponse as any).mockImplementation(() => {
      throw newMockedInstance(FormRejectError);
    });

    const response = await createDualButtonScriptDialogue().open({ player });

    expect(MessageFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(DialogueRejectedResponse);
    expect((response as DialogueCanceledResponse).reason).toBe(FormRejectReason.MalformedResponse);
  });

  it('call callback on button press', async () => {
    const player = mockPlayer();
    const callback = jest.fn();

    jest.mocked<() => MessageFormResponse>(MessageFormResponse as any).mockReturnValue({
      selection: 1,
      canceled: false,
    });

    await dualButtonScriptDialogue(
      'my.title',
      {
        name: 'my-top-button',
        text: 'my.top.button.text',
        callback: callback,
      },
      {
        name: 'my-bottom-button',
        text: 'my.bottom.button.text',
      }
    ).open({ player });

    expect(callback).toHaveBeenCalledWith('my-top-button');
  });

  it('Callback can return a value', async () => {
    const player = mockPlayer();
    const callback = jest.fn(async () => {
      return {
        foobar: 123,
        stuff: 'yes!',
      };
    });

    jest.mocked<() => MessageFormResponse>(MessageFormResponse as any).mockReturnValue({
      selection: 1,
      canceled: false,
    });

    const response = await dualButtonScriptDialogue(
      'my.title',
      {
        name: 'my-top-button',
        text: 'my.top.button.text',
        callback: callback,
      },
      {
        name: 'my-bottom-button',
        text: 'my.bottom.button.text',
      }
    ).open({ player });

    expect(callback).toHaveBeenCalledWith('my-top-button');
    expect(response).toBeInstanceOf(ButtonDialogueResponse);
    expect((response as any).callback).toEqual({
      foobar: 123,
      stuff: 'yes!',
    });
  });

  it('Support nested callbacks', async () => {
    const player = mockPlayer();
    const nestedCallback = jest.fn(async () => {
      return {
        nested: 'nested',
        no: 'yes!!!!',
      };
    });

    const callback = jest.fn(async () => {
      const response = await dualButtonScriptDialogue(
        'my nested title',
        {
          name: 'my-top-button',
          text: 'my.top.button.text',
          callback: nestedCallback,
        },
        {
          name: 'my-bottom-button',
          text: 'my.bottom.button.text',
        }
      ).open({ player });

      if (response instanceof ButtonDialogueResponse) {
        return {
          ...response.callback,
          augmenting: 'why not?',
        };
      }

      return 'whoops';
    });

    jest.mocked<() => MessageFormResponse>(MessageFormResponse as any).mockReturnValue({
      selection: 1,
      canceled: false,
    });

    const response = await dualButtonScriptDialogue(
      'my.title',
      {
        name: 'my-top-button',
        text: 'my.top.button.text',
        callback: callback,
      },
      {
        name: 'my-bottom-button',
        text: 'my.bottom.button.text',
      }
    ).open({ player });

    expect(nestedCallback).toHaveBeenCalledWith('my-top-button');
    expect(callback).toHaveBeenCalledWith('my-top-button');
    expect(response).toBeInstanceOf(ButtonDialogueResponse);
    expect((response as any).callback).toEqual({
      nested: 'nested',
      no: 'yes!!!!',
      augmenting: 'why not?',
    });
  });

  it('does not call others callback on button press', async () => {
    const player = mockPlayer();
    const callback = jest.fn();

    jest.mocked<() => MessageFormResponse>(MessageFormResponse as any).mockReturnValue({
      selection: 0,
      canceled: false,
    });

    await dualButtonScriptDialogue(
      'my.title',
      {
        name: 'my-top-button',
        text: 'my.top.button.text',
        callback: callback,
      },
      {
        name: 'my-bottom-button',
        text: 'my.bottom.button.text',
      }
    ).open({ player });

    expect(callback).not.toHaveBeenCalled();
  });
});
