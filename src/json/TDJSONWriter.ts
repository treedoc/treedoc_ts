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
    const opt = LangUtil.mergeDeep(new TDJSONWriterOption(), option);
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
    out.append(opt.deco("{", OPERATOR));
    if (node.children != null) {
      for (let i = 0; i < node.getChildrenSize(); i++) {
        const cn = opt.applyFilters(node.children[i]);
        if (cn == null)
          continue;

        if (opt.hasIndent()) {
          out.append('\n');
          out.append(childIndentStr);
        }
        if (!StringUtil.isJavaIdentifier(cn.key) || opt.alwaysQuoteName)
          // Quote the key in case  it's not valid java identifier
          this.writeQuotedString(out, opt.deco(cn.key as string, KEY), opt.quoteChar);
        else out.append(cn.key as string); // Map key will never be null
        out.append(opt.deco(":", OPERATOR));
        this.write(out, cn, opt, childIndentStr);
        if (i < node.getChildrenSize() - 1)
          // No need "," for last entry
          out.append(opt.deco(",", OPERATOR));
      }

      if (opt.hasIndent() && node.hasChildren()) {
        out.append('\n');
        out.append(indentStr);
      }
    }

    return out.append(opt.deco("}", OPERATOR));
  }

  private writeArray(out: Appendable, node: Readonly<TDNode>, opt: TDJSONWriterOption, indentStr: string, childIndentStr: string): Appendable {
    out.append(opt.deco("[", OPERATOR));
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
          out.append(opt.deco(",", OPERATOR));
      }

      if (opt.hasIndent() && node.children.length > 0) {
        out.append('\n');
        out.append(indentStr);
      }
    }

    return out.append(opt.deco("]", OPERATOR));
  }

  private writeSimple(out: Appendable, node: TDNode, opt: TDJSONWriterOption): Appendable {
    const value = node.value;
    if (typeof value === 'string')
      return this.writeQuotedString(out,  opt.deco(value as string, STRING), opt.quoteChar);

    return out.append(opt.deco(value + '', NON_STRING));
  }

  private writeQuotedString(out: Appendable, str: string, quoteChar: string): Appendable {
    out.append(quoteChar);
    out.append(StringUtil.cEscape(str, quoteChar) as string);
    return out.append(quoteChar);
  }
}
