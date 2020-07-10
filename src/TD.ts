import { TDJSONWriterOption, TDJSONWriter, TDObjectCoder, TDJSONParser } from '.';
import { TDObjectCoderOption } from '.';

export class TDEncodeOption {
  constructor(
    public objectCoderOption: TDObjectCoderOption = new TDObjectCoderOption(),
    public jsonWriterOption: TDJSONWriterOption = new TDJSONWriterOption(),
  ) {}
}

export class TDDecodeOption {}
/**
 * A group of convenient methods similar to JSON
 */
export default class TD {
  public static stringify(obj: any, opts: string | TDEncodeOption = '  '): string {
    const opt = typeof opts === 'string' ? new TDEncodeOption() : opts;
    if (typeof opts === 'string') 
      opt.jsonWriterOption.setIndentStr(opts);

    return TDJSONWriter.get().writeAsString(
      TDObjectCoder.get().encode(obj, opt.objectCoderOption),
      opt.jsonWriterOption,
    );
  }

  public static parse(str: string): any {
    return TDJSONParser.parse(str).toObject(false);
  }
}
