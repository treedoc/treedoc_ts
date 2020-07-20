import CharSource from '../core/CharSource';
import TDNode, { TDNodeType } from '../TDNode';
import StringCharSource from '../core/StringCharSource';

export default class TDJSONParserOption {
  public KEY_ID = `$id`;

  public uri?: string;

  /** In case there's no enclosed '[' of '{' on the root level, the default type. */
  public defaultRootType = TDNodeType.SIMPLE;

  public setDefaultRootType(type: TDNodeType) {
    this.defaultRootType = type;
    return this;
  }
}
