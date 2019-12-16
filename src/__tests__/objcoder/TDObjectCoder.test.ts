import TDObjectCoder from '../../objcoder/TDObjectCoder';
import TDJSONWriter from '../../json/TDJSONWriter';
import { TDJSONParser } from '../..';
import TDJSONWriterOption from '../../json/TDJSONWriterOption';

test('encode', () => {
  const commonObj: any = {
    title: "common",
  }
  const obj: any = {
    num: 10,
    obj:{
      str: '123',
      bool: true,
      date: new Date('2019-12-16T17:34:45.024Z'),
      nestObj: commonObj,
      cyclic: null,
    },
    obj1 : commonObj,
  }

  obj.obj.cyclic = obj;
  // console.log(JSON.stringify(obj));
  expect(
      TDJSONWriter.get().writeAsString(
          TDObjectCoder.get().encode(obj), 
          new TDJSONWriterOption()
              .setAlwaysQuoteName(false)
              .setQuoteChar('\'')
              .setIndentFactor(2)
      )        
  ).toBe(
`{
  num:10,
  obj:{
    str:'123',
    bool:true,
    date:'2019-12-16T17:34:45.024Z',
    nestObj:{
      title:'common',
      $id:1
    },
    cyclic:{
      $ref:'2'
    }
  },
  obj1:{
    $ref:'#1'
  }
}`
);
});
