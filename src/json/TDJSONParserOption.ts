import CharSource from './CharSource';
import TDNode, { TDNodeType } from '../TDNode';
import StringCharSource from './StringCharSource';

export default class TDJSONParserOption {
  public KEY_ID = `$id`;

  /** The source */
  public source: CharSource;
  public uri?: string;

  /** In case there's no enclosed '[' of '{' on the root level, the default type. */
  public defaultRootType = TDNodeType.SIMPLE;

  // /** Set source with a reader */
  // public TDJSONParserOption setReader(Reader reader) {
  //   source = reader == null ? null : new ReaderCharSource(reader);
  //   return this;
  // }

  public constructor(source: CharSource | string) {
    if (source instanceof CharSource) this.source = source;
    else this.source = new StringCharSource(source);
  }

  public setDefaultRootType(type: TDNodeType) {
    this.defaultRootType = type;
    return this;
  }
}
