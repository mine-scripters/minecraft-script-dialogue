import type * as MC from '@minecraft/server'
export const system: MC.System = {
  afterEvents: {
    scriptEventReceive: {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    }
  },
  currentTick: 0,
  clearRun: jest.fn(),
  run: jest.fn((callback: () => void) => {
    callback();
    return 0;
  }),
  runInterval: jest.fn((callback: () => void) => {
    callback();
    return 0;
  }),
  runTimeout: jest.fn((callback: () => void) => {
    callback();
    return 0;
  }),
};

