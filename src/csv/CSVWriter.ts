import { CSVOption } from './CSVOption';
import { TDNode, TDNodeType } from '../TDNode';
import { StringBuilder } from '../core/StringBuilder';
import { Appendable } from '../core/Appendable';
import { StringUtil } from '../core/StringUtil';
import { ClassUtil } from '../core/ClassUtil';

const { contains } = StringUtil;

export class CSVWriter {
  public static readonly instance = new CSVWriter();
  public static get() {
    return CSVWriter.instance;
  }

  public writeAsString(node: TDNode, opt = new CSVOption()): string { return this.write(new StringBuilder(), node, opt).toString(); }

  public write(out: Appendable, node: TDNode, opt: CSVOption ): Appendable {
    if (!opt.includeHeader) {
      this.writeRecords(out, node.childrenValueAsListOfList(), opt);
    } else {
      const keys = node.getChildrenKeys();
      if (node.type === TDNodeType.ARRAY && keys.length > 0)
        keys.shift();  // Remove array index key
      this.append(out, this.encodeRecord(keys, opt), opt.recordSep);
      this.writeRecords(out, node.childrenValueAsListOfListWithKeys(keys), opt);
    }
    return out;
  }

  public writeRecords(out: Appendable, records: object[][], opt: CSVOption): Appendable {
    records.forEach(r => this.append(out, this.encodeRecord(r, opt), opt.recordSep));
    return out;
  }

  private append(out: Appendable, ...strs: string[]) {
    for (const s of strs)
      out.append(s);
  }

  public encodeRecord(fields: any[], opt: CSVOption): string {
    return fields.map(f => this.encodeField(f, opt)).join(opt.fieldSep);
  }

  public encodeField(field: any, opt: CSVOption): string {
    if (field === null || field === undefined)
      return "";
    let str = typeof(field) === 'string' ? field : "" + field;
    if (str === "")
      return str;
    const quote = opt.quoteChar;
    if (this.needQuote(field, str, opt)) {
      if (str.indexOf(quote) > 0)
        // Very important to replace globally with RegExp. Otherwise, will only replace first occurence
        str = str.replace(new RegExp(quote, 'g'), quote + quote);
      return quote + str + quote;
    }
    return str;
  }


  needQuote(field: any, str: string, opt: CSVOption): boolean  {
    return contains(str, opt.quoteChar)
        || contains(str, opt.fieldSep)
        || contains(str, opt.recordSep)
        || (typeof(field) === 'string' && typeof(ClassUtil.toSimpleObject(str)) !== 'string');
  }
}
