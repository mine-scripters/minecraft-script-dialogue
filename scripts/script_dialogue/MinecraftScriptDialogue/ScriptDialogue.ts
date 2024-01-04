import { Player, RawMessage } from '@minecraft/server';
import { FormCancelationReason, FormRejectReason, FormResponse } from '@minecraft/server-ui';
import { asyncWait } from './Utils';

export interface Showable<T> {
  show(player: Player): Promise<T>;
}

export type ScriptDialogueString = string | RawMessage;

export interface OptionalShowDialogueOptions {
  lockPlayerCamera: boolean;
  busyRetriesCount: number;
  busyRetriesTick: number;
}

interface RequiredShowDialogueOptions {
  player: Player;
}

export interface ShowDialogueOptions extends Partial<OptionalShowDialogueOptions>, RequiredShowDialogueOptions {}

export interface ResolvedShowDialogueOptions extends RequiredShowDialogueOptions, OptionalShowDialogueOptions {}

export abstract class ScriptDialogue<T extends ScriptDialogueResponse> {
  private readonly DefaultShowDialogOptions: OptionalShowDialogueOptions = Object.freeze({
    lockPlayerCamera: true,
    busyRetriesCount: 5,
    busyRetriesTick: 5,
  });

  async open(options: ShowDialogueOptions): Promise<T | DialogueCanceledResponse | DialogueRejectedResponse> {
    const resolvedOptions = this.resolveShowDialogueOptions(options);

    try {
      if (resolvedOptions.lockPlayerCamera) {
        this.lockPlayerCamera(resolvedOptions);
      }

      try {
        const showable = await this.getShowable(resolvedOptions);
        const response = await this.show(showable, resolvedOptions);
        if (response.canceled) {
          return new DialogueCanceledResponse(response.cancelationReason!);
        }

        return this.processResponse(response, resolvedOptions);
      } catch (e) {
        if (e && typeof e === 'object' && 'reason' in e) {
          const exception = e as any;
          return new DialogueRejectedResponse(exception.reason, exception);
        } else {
          return new DialogueRejectedResponse(undefined, e);
        }
      }
    } finally {
      if (resolvedOptions.lockPlayerCamera) {
        this.unlockPlayerCamera(resolvedOptions);
      }
    }
  }

  private async show<T extends FormResponse>(showable: Showable<T>, options: ResolvedShowDialogueOptions): Promise<T> {
    let i = 0;
    while (true) {
      const response = await showable.show(options.player);
      if (response.canceled && response.cancelationReason === FormCancelationReason.UserBusy) {
        if (i < options.busyRetriesCount) {
          i++;
          await asyncWait(options.busyRetriesTick);
          if (options.player.isValid()) {
            continue;
          }
        }
      }

      return response;
    }
  }

  private lockPlayerCamera(options: ResolvedShowDialogueOptions) {
    options.player.runCommand(`inputpermission set ${options.player.name} camera disabled`);
    options.player.runCommand(`inputpermission set ${options.player.name} movement disabled`);
  }

  private unlockPlayerCamera(options: ResolvedShowDialogueOptions) {
    options.player.runCommand(`inputpermission set ${options.player.name} camera enabled`);
    options.player.runCommand(`inputpermission set ${options.player.name} movement enabled`);
  }

  private resolveShowDialogueOptions(options: ShowDialogueOptions): ResolvedShowDialogueOptions {
    return {
      ...this.DefaultShowDialogOptions,
      ...options,
    };
  }

  protected abstract getShowable(options: ResolvedShowDialogueOptions): Showable<FormResponse>;
  protected abstract processResponse(response: FormResponse, options: ResolvedShowDialogueOptions): T;
}

export abstract class ScriptDialogueResponse {}

export class DialogueCanceledResponse extends ScriptDialogueResponse {
  readonly reason: FormCancelationReason;

  constructor(reason: FormCancelationReason) {
    super();
    this.reason = reason;
  }
}

export class DialogueRejectedResponse extends ScriptDialogueResponse {
  readonly reason?: FormRejectReason;
  readonly exception: unknown;

  constructor(reason: FormRejectReason | undefined, exception: unknown) {
    super();
    this.reason = reason;
    this.exception = exception;
  }
}

export class ButtonDialogueResponse<T extends string> extends ScriptDialogueResponse {
  readonly selected: T;

  constructor(selected: T) {
    super();
    this.selected = selected;
  }
}
