import { TDObjectCoder } from '../objcoder/TDObjectCoder';
import { TDJSONWriter } from '../json/TDJSONWriter';
import { TDJSONWriterOption } from '../json/TDJSONWriterOption';

import { TDPath } from '../TDPath';
import { Part } from '..';

describe('TDPath', () => {
  test('parse', () => {
    expect(TDPath.parse('/p1/p2')).toEqual(
      new TDPath().addParts(Part.ofRoot(), Part.ofChild('p1'), Part.ofChild('p2')),
    );
    expect(TDPath.parse('../p1/p2')).toEqual(
      new TDPath().addParts(Part.ofRelative(1), Part.ofChild('p1'), Part.ofChild('p2')),
    );
    expect(TDPath.parse('./p1/p2')).toEqual(
      new TDPath().addParts(Part.ofRelative(0), Part.ofChild('p1'), Part.ofChild('p2')),
    );
    expect(TDPath.parse('#100/p1/p2')).toEqual(
      new TDPath().addParts(Part.ofChildOrId('#100', '100'), Part.ofChild('p1'), Part.ofChild('p2')),
    );
    expect(TDPath.parse('#/p1/p2')).toEqual(
      new TDPath().addParts(Part.ofRoot(), Part.ofChild('p1'), Part.ofChild('p2')),
    );
  });
});
