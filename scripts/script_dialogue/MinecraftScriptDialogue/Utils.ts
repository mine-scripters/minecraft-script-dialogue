import { Player, RawMessage, system } from '@minecraft/server';

export const assertNever = (value: never): never => {
  throw new Error(`Invalid param ${value}`);
};

export const asyncWait = async (ticks: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    system.runTimeout(() => {
      resolve();
    }, ticks);
  });
};

export const runUntilSuccess = (
  target: Player,
  command: string,
  expectedCount: number,
  stopIf: () => boolean
): Promise<void> => {
  return new Promise((resolve) => {
    const handler = system.runInterval(() => {
      const result = target.runCommand(command);
      if (result.successCount === expectedCount || stopIf()) {
        resolve();
        system.clearRun(handler);
      }
    }, 1);
  });
};

/**
 * Translation helper to make it easier to define a RawMessage with
 * translated text.
 *
 * @category Helpers
 * @param translate
 * @param with_
 * @constructor
 */
interface TranslateType {
  (translate: string, with_: RawMessage): RawMessage;
  (translate: string, ...with_: Array<string>): RawMessage;
}

export const TRANSLATE: TranslateType = (
  translate: string,
  with_: string | RawMessage,
  ...with__: Array<string>
): RawMessage => {
  return {
    translate,
    with: typeof with_ === 'string' ? [with_, ...with__] : with_,
  };
};
