import { Player } from '@minecraft/server';

export const mockPlayer = (): Player =>
  ({name:"Steve",
    sendMessage: jest.fn(),
    runCommand: jest.fn(),
    isValid: jest.fn(() => true),
  }) as unknown as Player;
