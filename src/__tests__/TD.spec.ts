import { TDJSONParser } from '../json/TDJSONParser';
import { TDJSONWriterOption } from '../json/TDJSONWriterOption';
import { TD, TDEncodeOption } from '../TD';
import { TDNodeType } from '../TDNode';

class TestObject {
  constructor(public title: string) {}
  nullObj = null;
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
    specialArray: [10, undefined, (a: number) => {;}, Symbol('')],
  },
  obj1: commonObj,
};

const commonObjStr = `{
  $type:'TestObject',
  title:'common'
}`;

// ES6 doesn't work
const commonObjConstructorEs5 = `{
  $type:'TestObject',
  functionObj:'function (num) {\\n        console.log(num);\\n    }'
}`

const commonObjConstructorEs6 = `{
  $type:'TestObject'
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
    expect(TD.stringify(commonObj, {
      coderOption: {
        showType: true
      },
      jsonOption: { 
        alwaysQuoteKey: false, 
        quoteChars: "'", 
        indentFactor: 2}
    })).toBe(commonObjStr);
  });

  test('stringify with showFunction', () => {
    const opt = new TDEncodeOption();
    opt.jsonOption
        .setAlwaysQuoteKey(false)
        .setQuoteChars("'")
        .setIndentFactor(2);
    opt.coderOption
        .setShowType(true)
        .setShowFunction(true);
    // Not sure why Object.keys doesn't return any keys for this particular test case for ES6
    expect(TD.stringify(commonObj.constructor.prototype, opt)).toBe(commonObjConstructorEs5);
  });

  test('stringify cyclic without options', () => {
    const str = TD.stringify(obj, "  ");
    console.log(str);
    expect(str).toBe(objStr);
  });

  test('parse', () => {
    const o = TD.parse(objStr);
    const str = TD.stringify(o, "  ");
    expect(str).toEqual(objStr);
    console.log(str);
    expect(o.obj1).toBe(o.obj.nestObj);
    expect(o.obj.cyclic).toBe(o);
    expect(o.arrayRef).toBe(o.obj.specialArray);
  });

  test('parseWithOption', () => {
    const o = TD.parse("a,b,c", { defaultRootType: TDNodeType.ARRAY });
    expect(o).toEqual(["a", "b", "c"]);
  });
  
  test('parseObjectWithoutStart', () => {
    const o = TD.parse("a:1,b:c", { defaultRootType: TDNodeType.MAP });
    expect(TD.stringify(o, {jsonOption: {quoteChars:"'"}})).toEqual("{'a':1,'b':'c'}");
  });

  test('stringifyTDNode', () => {
    const td = TDJSONParser.get().parse("{a:1, b:2}");
    const encodeOpt = new TDEncodeOption();
    encodeOpt.coderOption.coders = [];   // remote default coder which will use `toJSON()` method
    expect(TD.stringify(td, encodeOpt)).toMatchSnapshot();
  })
});
