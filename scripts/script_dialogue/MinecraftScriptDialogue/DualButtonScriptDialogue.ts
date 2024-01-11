import {
  ButtonDialogueResponse,
  ResolvedShowDialogueOptions,
  ScriptDialogue,
  ScriptDialogueString,
  Showable,
} from './ScriptDialogue';
import { MessageFormData, MessageFormResponse } from '@minecraft/server-ui';

/**
 * Dual button content.
 *
 * Note that dual buttons do not allow an icon to be used
 * @category Dual button script dialogue
 */
export interface DualButton<T extends string> {
  /**
   * Name used by the button, response is recorded using this name
   */
  name: T;
  /**
   * Displayed button's value
   */
  text: ScriptDialogueString;
  // dialogue?: ScriptDialogueString;

  callback?: (selected: string) => Promise<void>;
}

/**
 * Creates a new dual button script dialogue
 *
 * @category Creation
 * @category Dual button script dialogue
 * @param title Title of the dual button script dialogue
 * @param topButton Contents of the top button
 * @param bottomButton Contents of the bottom button
 */
export const dualButtonScriptDialogue = <T extends string>(
  title: ScriptDialogueString,
  topButton: DualButton<T>,
  bottomButton: DualButton<T>
) => {
  return new DualButtonScriptDialogue(title, undefined, topButton, bottomButton);
};

/**
 * Dual button script dialogue class.
 *
 * User's don't need to instantiate this class directly, instead they can use {@link dualButtonScriptDialogue}.
 *
 * Allows the users to optionally set a value for the body by calling {@link DualButtonScriptDialogue#setBody setBody}.
 *
 * @category Dual button script dialogue
 */
export class DualButtonScriptDialogue<T extends string> extends ScriptDialogue<ButtonDialogueResponse<T>> {
  private readonly title: ScriptDialogueString;
  private readonly body?: ScriptDialogueString;
  private readonly topButton: DualButton<T>;
  private readonly bottomButton: DualButton<T>;

  /**
   * @internal
   */
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

  /**
   * Sets content of the script dialogue
   * @param body
   */
  setBody(body: ScriptDialogueString) {
    return new DualButtonScriptDialogue(this.title, body, this.topButton, this.bottomButton);
  }

  protected getShowable(options: ResolvedShowDialogueOptions): Showable<MessageFormResponse> {
    const data = new MessageFormData();
    data.title(this.title);
    if (this.body) {
      data.body(this.body);
    }

    data.button1(this.bottomButton.text);
    data.button2(this.topButton.text);

    return data;
  }

  protected async processResponse(response: MessageFormResponse, options: ResolvedShowDialogueOptions) {
    const selectedButton = response.selection === 0 ? this.bottomButton : this.topButton;
    if (selectedButton.callback) {
      await selectedButton.callback(selectedButton.name);
    }
    return new ButtonDialogueResponse(selectedButton.name);
  }
}
