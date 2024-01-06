import { TRANSLATE } from './Utils';

describe('Utils/TRANSLATE', () => {
  it('Only translate', () => {
    expect(TRANSLATE('foo.bar.baz')).toEqual({
      translate: 'foo.bar.baz',
    });
  });

  it('With string params', () => {
    expect(TRANSLATE('foo.bar.baz', 'bar', 'baz')).toEqual({
      translate: 'foo.bar.baz',
      with: ['bar', 'baz'],
    });
  });

  it('With RawText', () => {
    expect(TRANSLATE('foo.bar.baz', TRANSLATE('abc'))).toEqual({
      translate: 'foo.bar.baz',
      with: {
        translate: 'abc',
      },
    });
  });
});
