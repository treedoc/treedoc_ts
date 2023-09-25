import { TDJSONWriterOption, TextType } from './TDJSONWriterOption';
import { TDNode, TDNodeType } from '../TDNode';
import { StringBuilder } from '../core/StringBuilder';
import { Appendable } from '../core/Appendable';
import { StringUtil } from '../core/StringUtil';
import { LangUtil } from '../core/LangUtil';

const NON_STRING = TextType.NON_STRING;
const STRING = TextType.STRING;
const KEY = TextType.KEY;
const OPERATOR = TextType.OPERATOR;

export class TDJSONWriter {
  public static readonly instance = new TDJSONWriter();
  public static get() {
    return TDJSONWriter.instance;
  }

  public static writeAsString(node: TDNode, opt: Partial<TDJSONWriterOption> = {}): string {
    return TDJSONWriter.get().writeAsString(node, opt);
  }

  public static write(out: Appendable, node: TDNode, opt: Partial<TDJSONWriterOption> = {}, indentStr = ''): Appendable {
    return TDJSONWriter.get().write(out, node, opt, (indentStr = ''));
  }

  public writeAsString(node: TDNode, opt: Partial<TDJSONWriterOption> = {}): string {
    const out = new StringBuilder();
    this.write(out, node, opt);
    return out.toString();
  }

  public write(out: Appendable, node: TDNode, option: Partial<TDJSONWriterOption> = {}, indentStr = ''): Appendable {
    const opt = option instanceof TDJSONWriterOption ? option : LangUtil.mergeDeep(new TDJSONWriterOption(), option);

    if (!node)
      return  out.append(opt.deco("null", NON_STRING))

    let childIndentStr = '';
    if (opt.hasIndent())
      childIndentStr = indentStr + opt.indentStr;

    switch (node.type) {
      case TDNodeType.MAP:
        return this.writeMap(out, node, opt, indentStr, childIndentStr);
      case TDNodeType.ARRAY:
        return this.writeArray(out, node, opt, indentStr, childIndentStr);
      default:
        return this.writeSimple(out, node, opt);
    }
  }

  private writeMap(out: Appendable, node: Readonly<TDNode>, opt: TDJSONWriterOption, indentStr: string, childIndentStr: string): Appendable {
    if (opt.useTypeWrapper) {
      const type = node.getChildValue(opt.KEY_TYPE);
      if (type != null) out.append(opt.deco(type as string, TextType.TYPE));
    }    
    out.append(opt.deco(opt.deliminatorObjectStart.substring(0, 1), OPERATOR));
    if (node.children != null) {
      for (let i = 0; i < node.getChildrenSize(); i++) {
        const cn = opt.applyFilters(node.children[i]);
        if (cn == null || (opt.useTypeWrapper && cn.key === opt.KEY_TYPE))
          continue;

        if (opt.hasIndent()) {
          out.append('\n');
          out.append(childIndentStr);
        }
        // Quote the key in case it's not valid java identifier so that it can be parsed back in Javascript
        this.writeQuotedString(out, cn.key!, opt, KEY, !StringUtil.isJavaIdentifier(cn.key) || opt.alwaysQuoteKey);
        out.append(opt.deco(opt.deliminatorKey, OPERATOR));
        this.write(out, cn, opt, childIndentStr);
        if (i < node.getChildrenSize() - 1)
          // No need "," for last entry
          out.append(opt.deco(opt.deliminatorValue, OPERATOR));
      }

      if (opt.hasIndent() && node.hasChildren()) {
        out.append('\n');
        out.append(indentStr);
      }
    }

    return out.append(opt.deco(opt.deliminatorObjectEnd.substring(0, 1), OPERATOR));
  }

  private writeArray(out: Appendable, node: Readonly<TDNode>, opt: TDJSONWriterOption, indentStr: string, childIndentStr: string): Appendable {
    out.append(opt.deco(opt.deliminatorArrayStart.substring(0, 1), OPERATOR));
    if (node.children != null) {
      for (let i = 0; i < node.getChildrenSize(); i++) {
        const cn = node.children[i];
        if (opt.hasIndent()) {
          out.append('\n');
          out.append(childIndentStr);
        }
        this.write(out, cn, opt, childIndentStr);
        if (i < node.getChildrenSize() - 1)
          // No need "," for last entry
          out.append(opt.deco(opt.deliminatorValue, OPERATOR));
      }

      if (opt.hasIndent() && node.children.length > 0) {
        out.append('\n');
        out.append(indentStr);
      }
    }

    return out.append(opt.deco(opt.deliminatorArrayEnd.substring(0, 1), OPERATOR));
  }

  private writeSimple(out: Appendable, node: TDNode, opt: TDJSONWriterOption): Appendable {
    const value = node.value;
    return typeof value === 'string'
      ? this.writeQuotedString(out, value, opt, STRING, opt.alwaysQuoteValue)
      : out.append(opt.deco("" + value, NON_STRING));    
  }

  private writeQuotedString(out: Appendable, str: string, opt: TDJSONWriterOption, type: TextType, alwaysQuote: boolean): Appendable {
    const quoteChar = this.determineQuoteChar(str, opt, alwaysQuote);
    return quoteChar === '' ? out.append(opt.deco(str, type)) : out.append(quoteChar)
        .append(opt.deco(StringUtil.cEscape(str, quoteChar)!, type))
        .append(quoteChar);
  }

    /** return '' indicate quote is not necessary */
  private determineQuoteChar(str: string, opt: TDJSONWriterOption, alwaysQuote: boolean): string {
      const needQuote = alwaysQuote || StringUtil.indexOfAnyChar(str, opt._quoteNeededChars) >= 0;
      if (!needQuote)
        return '';
      if (opt.quoteChars.length === 1)
        return opt.quoteChars.charAt(0);
  
      // Determine which quote char to use
      const counts: number[] = new Array<number>(opt.quoteChars.length);
      for(const ch of str) {
        const idx = opt.quoteChars.indexOf(ch);
        if (idx >= 0)
          counts[idx]++;
      }
      let minIdx = 0;  // default to first quote char
      for (let i = 1; i < counts.length; i++)
        if (counts[i] < counts[minIdx])
          minIdx = i;
      return opt.quoteChars.charAt(minIdx);
    }
}
