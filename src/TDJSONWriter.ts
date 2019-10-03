import TDJSONWriterOption from "./TDJSONWriterOption";
import TDNode, { TDNodeType } from "./TDNode";
import StringBuilder from "./StringBuilder";
import Appendable from "./Appendable";
import StringUtil from "./StringUtil";

export default class TDJSONWriter {
  public static readonly instance = new TDJSONWriter();
  public static get() { return TDJSONWriter.instance; }

  public writeAsString(node: TDNode, opt = new TDJSONWriterOption()): string {
    const out = new StringBuilder();
    this.write(out, node, opt);
    return out.toString();
  }

  public write(out: Appendable, node: TDNode, opt: TDJSONWriterOption, indentStr = ""): void {
    if (!node) {
      out.append("null");
      return;
    }

    const isCompact = opt.indentFactor === 0;
    let childIndentStr = "";
    if (!isCompact)
      childIndentStr = indentStr + opt.indentStr;

    switch (+node.type) {
      case TDNodeType.MAP:
        this.writeMap(out, node, opt, indentStr, childIndentStr);
        return;
      case TDNodeType.ARRAY:
        this.writeArray(out, node, opt, indentStr, childIndentStr);
        return;
      default:
        this.writeSimple(out, node, opt);
    }
  }

  private writeMap(out: Appendable, node: TDNode, opt: TDJSONWriterOption, indentStr: string, childIndentStr: string): void {
    out.append('{');
    if (node.children != null) {
      for (let i = 0; i < node.children.length; i++){
        const cn = node.children[i];
        if (opt.indentFactor > 0) {
          out.append('\n');
          out.append(childIndentStr);
        }
        if (!StringUtil.isJavaIdentifier(cn.key) || opt.alwaysQuoteName)  // Quote the key in case  it's not valid java identifier
          this.writeQuotedString(out, cn.key as string, opt.quoteChar);
        else
          out.append(cn.key as string);  // Map key will never be null
        out.append(":");
        this.write(out, cn, opt, childIndentStr);
        if (i < node.children.length - 1) // No need "," for last entry
          out.append(",");
      }

      if (opt.indentFactor > 0 && node.children.length > 0) {
        out.append('\n');
        out.append(indentStr);
      }
    }

    out.append('}');
  }

  private writeArray(out: Appendable, node: TDNode, opt: TDJSONWriterOption, indentStr: string, childIndentStr: string): void {
    out.append('[');
    if (node.children != null) {
      for (let i = 0; i < node.children.length; i++) {
        const cn = node.children[i];
        if (opt.indentFactor > 0) {
          out.append('\n');
          out.append(childIndentStr);
        }
        this.write(out, cn, opt, childIndentStr);
        if (i < node.children.length - 1) // No need "," for last entry
          out.append(",");
      }

      if (opt.indentFactor > 0 && node.children.length > 0) {
        out.append('\n');
        out.append(indentStr);
      }
    }

    out.append(']');
  }

  private writeSimple(out: Appendable, node: TDNode, opt: TDJSONWriterOption): void {
    if (typeof(node.value) === 'string') {
      this.writeQuotedString(out, node.value as string, opt.quoteChar);
      return;
    }

    out.append(node.value + "");
  }

  private writeQuotedString(out: Appendable, str: string, quoteChar: string): void {
    out.append(quoteChar);
    out.append(StringUtil.cEscape(str, quoteChar) as string);
    out.append(quoteChar);
  }
}
