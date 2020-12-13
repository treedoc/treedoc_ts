import { TDNode } from "..";
import { ValueType } from "../TDNode";

export default class TDJSONWriterOption {
  private mIndentFactor = 0;
  public alwaysQuoteName = true;
  public quoteChar = '"';
  /** @internal */
  public indentStr = ''; // Used internally
  /** Node mapper, if it returns null, node will be skipped */
  public nodeMapper: (n: TDNode) => TDNode = (n) => n;
  public valueMapper?: (n: TDNode) => ValueType;

  public set indentFactor(indentFactor: number) {
    this.mIndentFactor = indentFactor;
    this.indentStr = ' '.repeat(this.mIndentFactor);
  }

  public get indentFactor() { return this.mIndentFactor}

  public setIndentFactor(indentFactor: number) {
    this.indentFactor = indentFactor;
    return this;
  }

  public setIndentStr(str: string) {
    this.indentStr = str;
    return this;
  }

  public setAlwaysQuoteName(alwaysQuoteName: boolean) {
    this.alwaysQuoteName = alwaysQuoteName;
    return this;
  }

  public setQuoteChar(quoteChar: string) {
    this.quoteChar = quoteChar;
    return this;
  }

  public hasIndent() {
    return this.indentStr.length > 0;
  }

  public setNodeMapper(mapper: (n: TDNode) => TDNode) {
    this.nodeMapper = mapper;
    return this;
  }

  public setValueMapper(mapper: (n: TDNode) => ValueType) {
    this.valueMapper = mapper;
    return this;
  }
}
