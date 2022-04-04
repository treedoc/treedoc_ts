import { JSONPointer } from '../../json/JSONPointer';
import { TDPath, Part } from '../../TDPath';

test('testParse', () => {
  verify('//ab.c/p1#/p1', new TDPath('//ab.c/p1').addParts(Part.ofRoot(), Part.ofChild('p1')));
  verify('//ab.c/p1#p1/p2', new TDPath('//ab.c/p1').addParts(Part.ofChildOrId('p1', 'p1'), Part.ofChild('p2')));
  expect(JSONPointer.get().parse('1/p1', true)).toStrictEqual(
    new TDPath().addParts(Part.ofRelative(1), Part.ofChild('p1')));
  verify('#../p1', new TDPath().addParts(Part.ofRelative(1), Part.ofChild('p1')));
  verify('#./p1', new TDPath().addParts(Part.ofRelative(0), Part.ofChild('p1')));
  verify('../', new TDPath().addParts(Part.ofRelative(1)));
});

function verify(str: string, expected: TDPath) {
  expect(JSONPointer.get().parse(str)).toStrictEqual(expected);
}
