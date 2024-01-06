import { multiButtonScriptDialogue } from './MultiButtonScriptDialogue';
import {
  ActionFormData,
  ActionFormResponse,
  FormCancelationReason,
  FormRejectReason,
  ModalFormData,
  ModalFormResponse,
} from '@minecraft/server-ui';
import { ButtonDialogueResponse, DialogueCanceledResponse, DialogueRejectedResponse } from './ScriptDialogue';
import { FormRejectError } from '../../../__mocks__/@minecraft/server-ui';
import { mockPlayer } from '../test/server-utils';
import {
  inputDropdown,
  inputScriptDialogue,
  InputScriptDialogueResponse,
  inputSlider,
  inputText,
  inputToggle,
} from './InputScriptDialogue';

const TITLE = 'my.title';

const DROPDOWN = Object.freeze({
  NAME: 'input-01',
  TEXT: 'my-dropdown1',
  OPTIONS1: {
    LABEL: 'my-option-01-number',
    VALUE: 3,
  },
  OPTIONS2: {
    LABEL: 'my-option-02-string',
    VALUE: 'my-value',
  },
  OPTIONS3: {
    LABEL: 'my-option-03-bool',
    VALUE: true,
  },
});

const SLIDER = Object.freeze({
  NAME: 'input-02',
  TEXT: 'my-slider1',
  MIN: 10,
  MAX: 88,
  STEP: 11,
  DEFAULT: 33,
});

const TEXT = Object.freeze({
  NAME: 'input-03',
  TEXT: 'my-text1',
  PLACEHOLDER: 'placeholder-text',
  DEFAULT: 'yo',
});

const TOGGLE = Object.freeze({
  NAME: 'input-04',
  TEXT: 'my-toggle1',
  DEFAULT: true,
});

const DROPDOWN2 = Object.freeze({
  NAME: 'input-05',
  TEXT: 'my-dropdown2',
  OPTIONS1: {
    LABEL: 'my-option-01-number',
    VALUE: 3,
  },
  OPTIONS2: {
    LABEL: 'my-option-02-string',
    VALUE: 'my-value',
  },
  OPTIONS3: {
    LABEL: 'my-option-03-bool',
    VALUE: true,
  },
  DEFAULT: 1,
});

const createInputScriptDialogue = () => {
  return inputScriptDialogue(TITLE)
    .addElement(
      inputDropdown(DROPDOWN.NAME, DROPDOWN.TEXT)
        .addOption(DROPDOWN.OPTIONS1.LABEL, DROPDOWN.OPTIONS1.VALUE)
        .addOption(DROPDOWN.OPTIONS2.LABEL, DROPDOWN.OPTIONS2.VALUE)
        .addOption(DROPDOWN.OPTIONS3.LABEL, DROPDOWN.OPTIONS3.VALUE)
    )
    .addElement(inputSlider(SLIDER.NAME, SLIDER.TEXT, SLIDER.MIN, SLIDER.MAX, SLIDER.STEP, SLIDER.DEFAULT))
    .addElements([
      inputText(TEXT.NAME, TEXT.TEXT, TEXT.PLACEHOLDER, TEXT.DEFAULT),
      inputToggle(TOGGLE.NAME, TOGGLE.TEXT, TOGGLE.DEFAULT),
      inputDropdown(DROPDOWN2.NAME, DROPDOWN2.TEXT)
        .addOption(DROPDOWN2.OPTIONS1.LABEL, DROPDOWN2.OPTIONS1.VALUE)
        .addOption(DROPDOWN2.OPTIONS2.LABEL, DROPDOWN2.OPTIONS2.VALUE)
        .addOption(DROPDOWN2.OPTIONS3.LABEL, DROPDOWN2.OPTIONS3.VALUE)
        .setDefaultValueIndex(DROPDOWN2.DEFAULT),
    ]);
};

describe('InputScriptDialogue', () => {
  it('Title, complex setup', async () => {
    const player = mockPlayer();

    await createInputScriptDialogue().open({ player });

    expect(ModalFormData).toHaveBeenCalledTimes(1);

    const instance = jest.mocked(ModalFormData).mock.results[0].value as ModalFormData;

    expect(instance.title).toHaveBeenCalledWith(TITLE);
    expect(instance.dropdown).toHaveBeenCalledTimes(2);
    expect(instance.dropdown).toHaveBeenNthCalledWith(
      1,
      DROPDOWN.TEXT,
      [DROPDOWN.OPTIONS1.LABEL, DROPDOWN.OPTIONS2.LABEL, DROPDOWN.OPTIONS3.LABEL],
      0
    );
    expect(instance.dropdown).toHaveBeenNthCalledWith(
      2,
      DROPDOWN2.TEXT,
      [DROPDOWN2.OPTIONS1.LABEL, DROPDOWN2.OPTIONS2.LABEL, DROPDOWN2.OPTIONS3.LABEL],
      1
    );
    expect(instance.slider).toHaveBeenCalledWith(SLIDER.TEXT, SLIDER.MIN, SLIDER.MAX, SLIDER.STEP, SLIDER.DEFAULT);
    expect(instance.textField).toHaveBeenCalledWith(TEXT.TEXT, TEXT.PLACEHOLDER, TEXT.DEFAULT);
    expect(instance.toggle).toHaveBeenCalledWith(TOGGLE.TEXT, TOGGLE.DEFAULT);

    expect(instance.show).toHaveBeenCalledWith(player);
  });

  it('Maps values to response', async () => {
    const player = mockPlayer();

    jest.mocked<() => ModalFormResponse>(ModalFormResponse as any).mockReturnValue({
      formValues: [
        2, // dropdown
        55, // slider
        'hello world', // text
        false, //toggle
        1, // dropdown2
      ],
      canceled: false,
    });

    const response = await createInputScriptDialogue().open({ player });

    expect(ModalFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(InputScriptDialogueResponse);
    expect((response as InputScriptDialogueResponse<string>).values).toEqual({
      [DROPDOWN.NAME]: DROPDOWN.OPTIONS3.VALUE,
      [SLIDER.NAME]: 55,
      [TEXT.NAME]: 'hello world',
      [TOGGLE.NAME]: false,
      [DROPDOWN2.NAME]: DROPDOWN2.OPTIONS2.VALUE,
    });
  });

  it('Test canceled dialogue', async () => {
    const player = mockPlayer();
    jest.mocked<() => ModalFormResponse>(ModalFormResponse as any).mockReturnValue({
      canceled: true,
      cancelationReason: FormCancelationReason.UserBusy,
    });

    const response = await createInputScriptDialogue().open({ player });

    expect(ModalFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(DialogueCanceledResponse);
    expect((response as DialogueCanceledResponse).reason).toBe(FormCancelationReason.UserBusy);
  });

  it('Test rejected dialogue', async () => {
    const player = mockPlayer();
    jest.mocked<() => ModalFormResponse>(ModalFormResponse as any).mockImplementation(() => {
      throw new FormRejectError();
    });

    const response = await createInputScriptDialogue().open({ player });

    expect(ModalFormData).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(DialogueRejectedResponse);
    expect((response as DialogueCanceledResponse).reason).toBe(FormRejectReason.MalformedResponse);
  });
});
