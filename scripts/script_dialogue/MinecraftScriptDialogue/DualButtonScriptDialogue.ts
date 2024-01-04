import {
  ButtonDialogueResponse,
  ResolvedShowDialogueOptions,
  ScriptDialogue,
  ScriptDialogueString,
  Showable,
} from './ScriptDialogue';
import { FormResponse, MessageFormData, MessageFormResponse } from '@minecraft/server-ui';

interface DualButton<T extends string> {
  name: T;
  text: ScriptDialogueString;
  // dialogue?: ScriptDialogueString;
}

export const dualButtonScriptDialogue = <T extends string>(
  title: ScriptDialogueString,
  topButton: DualButton<T>,
  bottomButton: DualButton<T>
) => {
  return new DualButtonScriptDialogue(title, undefined, topButton, bottomButton);
};

class DualButtonScriptDialogue<T extends string> extends ScriptDialogue<ButtonDialogueResponse<T>> {
  readonly title: ScriptDialogueString;
  readonly body?: ScriptDialogueString;
  readonly topButton: DualButton<T>;
  readonly bottomButton: DualButton<T>;

  constructor(
    title: ScriptDialogueString,
    body: ScriptDialogueString | undefined,
    topButton: DualButton<T>,
    bottomButton: DualButton<T>
  ) {
    super();
    this.title = title;
    this.body = body;
    this.topButton = topButton;
    this.bottomButton = bottomButton;
  }

  setBody(body: ScriptDialogueString) {
    return new DualButtonScriptDialogue(this.title, body, this.topButton, this.bottomButton);
  }

  protected getShowable(options: ResolvedShowDialogueOptions): Showable<FormResponse> {
    const data = new MessageFormData();
    data.title(this.title);
    if (this.body) {
      data.body(this.body);
    }

    data.button1(this.bottomButton.text);
    data.button2(this.topButton.text);

    return data;
  }

  protected processResponse(response: FormResponse, options: ResolvedShowDialogueOptions) {
    const selectedButton = (response as MessageFormResponse).selection === 0 ? this.bottomButton : this.topButton;
    return new ButtonDialogueResponse(selectedButton.name);
  }
}
