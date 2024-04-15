import { RawMessage, system } from '@minecraft/server';

export const asyncWait = async (ticks: number): Promise<void> => {
  return new Promise<void>((resolve) => {
    system.runTimeout(() => {
      resolve();
    }, ticks);
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
