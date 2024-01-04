import { ActionFormData, ActionFormResponse, FormResponse } from '@minecraft/server-ui';
import {
  ButtonDialogueResponse,
  ResolvedShowDialogueOptions,
  ScriptDialogue,
  ScriptDialogueString,
  Showable,
} from './ScriptDialogue';

export const multiButtonScriptDialogue = (title: ScriptDialogueString): MultiButtonScriptDialogueEmpty<never> => {
  return new MultiButtonScriptDialogueEmpty(title);
};

interface MultiButton<T extends string> {
  name: T;
  text: ScriptDialogueString;
  iconPath?: string;
  // dialogue?: ScriptDialogueString;
}

type ButtonsType<T extends string> = Array<MultiButton<T>>;
type MultiButtonDialogueReturn<T1 extends string, T2 extends string> = MultiButtonDialogue<NonNullable<T1 | T2>>;

class MultiButtonScriptDialogueEmpty<T extends string> {
  readonly title: ScriptDialogueString;
  readonly body?: ScriptDialogueString;

  constructor(title: ScriptDialogueString, body?: ScriptDialogueString) {
    this.title = title;
    this.body = body;
  }

  setBody(body: ScriptDialogueString): MultiButtonScriptDialogueEmpty<T> {
    return new MultiButtonScriptDialogueEmpty(this.title, body);
  }

  addButton<NAME extends string>(
    name: NAME,
    text: ScriptDialogueString,
    iconPath?: string
  ): MultiButtonDialogueReturn<T, NAME> {
    return new MultiButtonDialogue<T | NAME>(this.title, this.body, [
      {
        name,
        text,
        iconPath,
      },
    ]) as MultiButtonDialogueReturn<T, NAME>;
  }

  addButtons<NAMES extends string>(buttons: Array<MultiButton<NAMES>>): MultiButtonDialogueReturn<T, NAMES> {
    return new MultiButtonDialogue<T | NAMES>(this.title, this.body, [...buttons]) as MultiButtonDialogueReturn<
      T,
      NAMES
    >;
  }
}

export class MultiButtonDialogue<T extends string> extends ScriptDialogue<ButtonDialogueResponse<T>> {
  readonly title: ScriptDialogueString;
  readonly body?: ScriptDialogueString;
  readonly buttons: ButtonsType<T>;

  constructor(title: ScriptDialogueString, body: ScriptDialogueString | undefined, buttons: ButtonsType<T>) {
    super();
    this.title = title;
    this.body = body;
    this.buttons = buttons;
  }

  setTitle(title: ScriptDialogueString): MultiButtonScriptDialogueEmpty<T> {
    return new MultiButtonDialogue<T>(title, this.body, this.buttons);
  }

  setBody(body: ScriptDialogueString): MultiButtonScriptDialogueEmpty<T> {
    return new MultiButtonDialogue<T>(this.title, body, this.buttons);
  }

  addButton<NAME extends string>(
    name: NAME,
    text: ScriptDialogueString,
    iconPath?: string
  ): MultiButtonDialogueReturn<T, NAME> {
    return new MultiButtonDialogue<T | NAME>(this.title, this.body, [
      ...this.buttons,
      {
        name,
        text,
        iconPath,
      },
    ]) as MultiButtonDialogueReturn<T, NAME>;
  }

  addButtons<NAMES extends string>(buttons: Array<MultiButton<NAMES>>) {
    return new MultiButtonDialogue<T | NAMES>(this.title, this.body, [
      ...this.buttons,
      ...buttons,
    ]) as MultiButtonDialogueReturn<T, NAMES>;
  }

  protected getShowable(options: ResolvedShowDialogueOptions): Showable<FormResponse> {
    const formData = new ActionFormData();

    formData.title(this.title);

    if (this.body) {
      formData.body(this.body);
    }

    this.buttons.forEach((button) => {
      formData.button(button.text, button.iconPath);
    });

    return formData;
  }

  protected processResponse(response: FormResponse, options: ResolvedShowDialogueOptions): ButtonDialogueResponse<T> {
    const selectedButton = this.buttons[(response as ActionFormResponse).selection as number];
    return new ButtonDialogueResponse<T>(selectedButton.name);
  }
}
