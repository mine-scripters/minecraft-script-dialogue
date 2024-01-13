import Constructor = jest.Constructor;

export const createMockedClass = <T>(callable: () => T, args: T): T => {
  const instance = Object.create(callable.prototype);
  return Object.assign(instance, args);
};

export const newMockedInstance = <T>(mockedClass: unknown): T => {
  return new (jest.mocked(mockedClass) as jest.MockedClass<Constructor>)();
};
