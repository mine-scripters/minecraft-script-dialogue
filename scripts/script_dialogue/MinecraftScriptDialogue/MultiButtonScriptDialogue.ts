import { ActionFormData, ActionFormResponse } from '@minecraft/server-ui';
import {
  ButtonDialogueResponse,
  MissingButtonsException,
  ResolvedShowDialogueOptions,
  ScriptDialogue,
  ScriptDialogueString,
  Showable,
  UIElement,
} from './ScriptDialogue';
import { assertNever } from './Utils';

/**
 * Initializes a empty multi button script dialogue.
 *
 * Buttons needs to be added using {@link MultiButtonDialogue#addButton} or {@link MultiButtonDialogue#addButtons}
 *
 * @category Creation
 * @category Multi button script dialogue
 * @param title
 */
export const multiButtonScriptDialogue = (title: ScriptDialogueString): MultiButtonDialogue<never, never> => {
  return new MultiButtonDialogue(title, undefined, []);
};

/**
 * Multi button content.
 * @category Multi button script dialogue
 */
export interface MultiButton<T extends string, Callback> {
  /**
   * Name used by the button, response is recorded using this name
   */
  name: T;
  /**
   * Displayed button's value
   */
  text: ScriptDialogueString;
  /**
   * Path to an icon used for the icon
   */
  iconPath?: string;
  /**
   * A function that is executed when the button is pressed.
   * This function is executed before returning from {@link MultiButtonDialogue#open}.
   * @param selected
   */
  callback?: (selected: string) => Promise<Callback>;
}

/**
 * Class used to build multi button script dialogues.
 *
 * Use {@link multiButtonScriptDialogue} to initialize one.
 *
 * @category Multi button script dialogue
 * @see {@link multiButtonScriptDialogue}
 */
export class MultiButtonDialogue<T extends string, Callback = undefined> extends ScriptDialogue<
  ButtonDialogueResponse<T, Callback>
> {
  private readonly title: ScriptDialogueString;
  private readonly body?: ScriptDialogueString;
  private readonly elements: Array<MultiButton<T, Callback> | UIElement>;

  /**
   * @internal
   */
  constructor(
    title: ScriptDialogueString,
    body: ScriptDialogueString | undefined,
    elements: Array<MultiButton<T, Callback> | UIElement>
  ) {
    super();
    this.title = title;
    this.body = body;
    this.elements = elements;
  }

  /**
   * Sets the content body of the multi button dialogue
   * @param body
   */
  setBody(body: ScriptDialogueString): MultiButtonDialogue<T, Callback> {
    return new MultiButtonDialogue<T, Callback>(this.title, body, this.elements);
  }

  addDivider(): MultiButtonDialogue<T, Callback> {
    return new MultiButtonDialogue<T, Callback>(this.title, this.body, [
      ...this.elements,
      {
        type: 'divider',
      },
    ]);
  }

  addHeader(text: ScriptDialogueString): MultiButtonDialogue<T, Callback> {
    return new MultiButtonDialogue<T, Callback>(this.title, this.body, [
      ...this.elements,
      {
        type: 'header',
        text,
      },
    ]);
  }

  addLabel(text: ScriptDialogueString): MultiButtonDialogue<T, Callback> {
    return new MultiButtonDialogue<T, Callback>(this.title, this.body, [
      ...this.elements,
      {
        type: 'label',
        text,
      },
    ]);
  }

  /**
   * Adds a button to the multi button script dialogue.
   * @param name name of the button
   * @param text content of the button
   * @param iconPath path to an icon to show in the button
   */
  addButton<NAME extends string, ButtonCallback = undefined>(
    name: NAME,
    text: ScriptDialogueString,
    iconPath?: string,
    callback?: (selected: string) => Promise<ButtonCallback>
  ): MultiButtonDialogue<NonNullable<T | NAME>, Callback | ButtonCallback> {
    return new MultiButtonDialogue<NonNullable<T | NAME>, Callback | ButtonCallback>(this.title, this.body, [
      ...this.elements,
      {
        name,
        text,
        iconPath,
        callback,
      },
    ]) as MultiButtonDialogue<NonNullable<T | NAME>, Callback | ButtonCallback>;
  }

  /**
   * Adds multiple buttons to the multi button script dialogue.
   * @param buttons array of buttons
   */
  addButtons<NAMES extends string, ButtonCallback = undefined>(
    buttons: Array<MultiButton<NAMES, ButtonCallback>>
  ): MultiButtonDialogue<NonNullable<T | NAMES>, Callback | ButtonCallback> {
    return new MultiButtonDialogue<T | NAMES, Callback | ButtonCallback>(this.title, this.body, [
      ...this.elements,
      ...buttons,
    ]) as MultiButtonDialogue<NonNullable<T | NAMES>, Callback | ButtonCallback>;
  }

  /**
   * Adds multiple buttons and ui elements to the multi button script dialogue.
   * @param buttons array of buttons
   */
  addElements<NAMES extends string, ButtonCallback = undefined>(
    elements: Array<MultiButton<NAMES, ButtonCallback> | UIElement>
  ): MultiButtonDialogue<NonNullable<T | NAMES>, Callback | ButtonCallback> {
    return new MultiButtonDialogue<T | NAMES, Callback | ButtonCallback>(this.title, this.body, [
      ...this.elements,
      ...elements,
    ]) as MultiButtonDialogue<NonNullable<T | NAMES>, Callback | ButtonCallback>;
  }

  protected getShowable(_options: ResolvedShowDialogueOptions): Showable<ActionFormResponse> {
    if (this.elements.length === 0) {
      throw new MissingButtonsException();
    }

    const formData = new ActionFormData();

    formData.title(this.title);

    if (this.body) {
      formData.body(this.body);
    }

    this.elements.forEach((element) => {
      if ('type' in element) {
        const type = element.type;
        switch (type) {
          case 'divider':
            formData.divider();
            break;
          case 'header':
            formData.header(element.text);
            break;
          case 'label':
            formData.label(element.text);
            break;
          default:
            assertNever(type);
        }
      } else {
        formData.button(element.text, element.iconPath);
      }
    });

    return formData;
  }

  protected async processResponse(
    response: ActionFormResponse,
    _options: ResolvedShowDialogueOptions
  ): Promise<ButtonDialogueResponse<T, Callback>> {
    const buttons = this.elements.filter((e) => !('type' in e)) as Array<MultiButton<T, Callback>>;
    const selectedButton = buttons[response.selection as number];
    let callbackResponse: Callback | undefined = undefined;
    if (selectedButton.callback) {
      callbackResponse = await selectedButton.callback(selectedButton.name);
    }
    return new ButtonDialogueResponse<T, Callback>(selectedButton.name, callbackResponse);
  }
}
