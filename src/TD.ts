import { TDJSONWriterOption, TDJSONWriter, TDObjectCoder, TDJSONParser } from '.';
import { TDObjectCoderOption } from '.';
import LangUtil, { RecursivePartial } from './core/LangUtil';

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
  public static stringify(obj: any, opts: string | RecursivePartial<TDEncodeOption> = ''): string {
    const opt = new TDEncodeOption();
    if (typeof opts === 'string') 
      opt.jsonOption.setIndentStr!(opts);
    else
      LangUtil.mergeDeep(opt, opts);

    return TDJSONWriter.writeAsString(
      TDObjectCoder.encode(obj, opt.coderOption),
      opt.jsonOption,
    );
  }

  public static parse(str: string): any {
    return TDJSONParser.get().parse(str).toObject(false);
  }
}
