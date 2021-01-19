import CSVOption from './CSVOption';
import TDNode, { TDNodeType } from '../TDNode';
import StringBuilder from '../core/StringBuilder';
import Appendable from '../core/Appendable';
import StringUtil from '../core/StringUtil';
import { TreeDoc } from '..';

const { contains } = StringUtil;

export default class CSVNWriter {
  public static readonly instance = new CSVNWriter();
  public static get() {
    return CSVNWriter.instance;
  }

  public writeAsString(node: TDNode, opt = new CSVOption()): string { return this.write(new StringBuilder(), node, opt).toString(); }

  public write(out: Appendable, node: TDNode, opt: CSVOption): typeof out {
    if (node.children) {
      for (const row of node.children) {
        if (row.children) {
          for (const field of row.children) {
            this.writeField(out, field, opt);
            out.append(opt.fieldSep);
          }
          out.append(opt.recordSep);
        }
      }
    }
    return out;
  }

  writeField(out: Appendable, field: TDNode, opt: CSVOption): typeof out {
    const quote = opt.quoteChar;
    let str = "" + field.value;
    if (contains(str, quote) || contains(str, opt.fieldSep) || contains(str, opt.recordSep)) {
      if (contains(str, quote))
        str = str.replace(new RegExp(quote, 'g'), quote + quote);
      return out.append(quote).append(str).append(quote);
    }
    return out.append(str);
  }
}
