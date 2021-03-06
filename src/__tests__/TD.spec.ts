import TDJSONWriter from '../json/TDJSONWriter';
import TDJSONWriterOption from '../json/TDJSONWriterOption';

import TD, { TDEncodeOption } from '../TD';

class TestObject {
  constructor(public title: string) {}
  nullObj: null;
  functionObj(num: number[]) {
    console.log(num);
  }
}

const commonObj = new TestObject('common');

const obj: any = {
  num: 10,
  obj: {
    str: '123',
    bool: true,
    date: new Date('2019-12-16T17:34:45.024Z'),
    nestObj: commonObj,
    cyclic: null,
    specialArray: [10, undefined, function(a: number) {}, Symbol('')],
  },
  obj1: commonObj,
};

const commonObjStr = `{
  $type:'TestObject',
  title:'common'
}`;

const commonObjConstructor = `{
  $type:'TestObject',
  functionObj:'function (num) {\\n        console.log(num);\\n    }'
}`

const objStr = `{
  "num":10,
  "obj":{
    "str":"123",
    "bool":true,
    "date":"2019-12-16T17:34:45.024Z",
    "nestObj":{
      "title":"common",
      "$id":1
    },
    "cyclic":{
      "$ref":"../../"
    },
    "specialArray":[
      10,
      null,
      null,
      null
    ]
  },
  "obj1":{
    "$ref":"#1"
  },
  "arrayRef":{
    "$ref":"/obj/specialArray"
  }
}`;
obj.obj.cyclic = obj;
obj.arrayRef = obj.obj.specialArray;

describe('TD', () => {
  test('stringify with Options', () => {
    const opt = new TDEncodeOption();
    opt.jsonOption
      .setAlwaysQuoteName(false)
      .setQuoteChar("'")
      .setIndentFactor(2);
    opt.coderOption.showType = true;
    expect(TD.stringify(commonObj, opt)).toBe(commonObjStr);
  });

  test('stringify with showFunction', () => {
    const opt = new TDEncodeOption();
    opt.jsonOption
        .setAlwaysQuoteName(false)
        .setQuoteChar("'")
        .setIndentFactor(2);
    opt.coderOption
        .setShowType(true)
        .setShowFunction(true);
    expect(TD.stringify(commonObj.constructor.prototype, opt)).toBe(commonObjConstructor);
  });

  test('stringify cyclic without options', () => {
    console.log(TD.stringify(obj));
    expect(TD.stringify(obj)).toBe(objStr);
  });

  test('parse', () => {
    const o = TD.parse(objStr);
    const str = TD.stringify(o);
    expect(str).toEqual(objStr);
    console.log(str);
    expect(o.obj1).toBe(o.obj.nestObj);
    expect(o.obj.cyclic).toBe(o);
    expect(o.arrayRef).toBe(o.obj.specialArray);
  });
});
