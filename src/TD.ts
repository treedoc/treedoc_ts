import { TDJSONWriterOption } from './json/TDJSONWriterOption';
import { TDJSONWriter } from './json/TDJSONWriter';
import { TDObjectCoder, TDObjectCoderOption } from './objcoder/TDObjectCoder';
import { LangUtil, RecursivePartial } from './core/LangUtil';
import { TDJSONParserOption } from './json/TDJSONParserOption';
import { TDJSONParser } from './json/TDJSONParser';

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
export class TD {
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

  public static parse(str: string, opts: RecursivePartial<TDJSONParserOption> = {}): any {
    return TDJSONParser.get().parse(str, opts).toObject(false);
  }
}
