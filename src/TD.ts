import { TDJSONWriterOption, TDJSONWriter, TDObjectCoder, TDJSONParser } from '.';
import { TDObjectCoderOption } from '.';

export class TDEncodeOption {
  constructor(
    public coderOption: TDObjectCoderOption = new TDObjectCoderOption(),
    public jsonOption: TDJSONWriterOption = new TDJSONWriterOption(),
  ) {}

  public setCodeOption(codeOpt : TDObjectCoderOption) {
    this.coderOption = codeOpt;
    return this;
  }

  public setJsonOption(jsonOpt : TDJSONWriterOption) {
    this.jsonOption = jsonOpt;
    return this;
  }
}

export class TDDecodeOption {}
/**
 * A group of convenient methods similar to JSON
 */
export default class TD {
  public static stringify(obj: any, opts: string | TDEncodeOption = '  '): string {
    const opt = typeof opts === 'string' ? new TDEncodeOption() : opts;
    if (typeof opts === 'string') 
      opt.jsonOption.setIndentStr(opts);

    return TDJSONWriter.get().writeAsString(
      TDObjectCoder.get().encode(obj, opt.coderOption),
      opt.jsonOption,
    );
  }

  public static parse(str: string): any {
    return TDJSONParser.parse(str).toObject(false);
  }
}
