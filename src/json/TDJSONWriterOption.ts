import { TDNode } from "..";
import { ValueType } from "../TDNode";
import { NodeFilter } from "./NodeFilter";
import { TDJSONOption } from "./TDJSONOption";

export enum TextType {OPERATOR, KEY, STRING, NON_STRING}

export class TDJSONWriterOption extends TDJSONOption {
  private mIndentFactor = 0;
  public alwaysQuoteName = true;
  public quoteChar = '"';
  /** @internal */
  public indentStr = ''; // Used internally
  textDecorator?: (str: string, textType: TextType) => string;
  
  /** Node mapper, if it returns null, node will be skipped */
  public nodeFilters: NodeFilter[] = [];

  public set indentFactor(indentFactor: number) {
    this.mIndentFactor = indentFactor;
    this.indentStr = ' '.repeat(this.mIndentFactor);
  }

  public get indentFactor() { return this.mIndentFactor}

  public setIndentFactor(indentFactor: number) { this.indentFactor = indentFactor; return this; }
  public setIndentStr(str: string) { this.indentStr = str; return this; }
  public setAlwaysQuoteName(alwaysQuoteName: boolean) { this.alwaysQuoteName = alwaysQuoteName; return this; }
  public setQuoteChar(quoteChar: string) { this.quoteChar = quoteChar; return this; }
  public setTextDecorator(deco: (str: string, textType: TextType) => string) { this.textDecorator = deco; return this; }

  public hasIndent() {
    return this.indentStr.length > 0;
  }

  public applyFilters(n: TDNode): TDNode | undefined {
    let result: TDNode | undefined = n;
    for (const f of this.nodeFilters){
      if (result == null)
        break;
      result = f.apply(result);
    }
    return result;
  }

  public addNodeFilter(...filters: NodeFilter[]) {
    for (const f of filters)
      this.nodeFilters.push(f);
    return this;
  }

  public deco(text: string, type: TextType) {
    return this.textDecorator == null ? text : this.textDecorator(text, type);
  }
}
