import { TDNode, TDNodeType, ValueType } from '../TDNode';
import { CSVOption } from './CSVOption';
import { CharSource } from '../core/CharSource';
import { StringBuilder } from '../core/StringBuilder';
import { TreeDoc } from '../TreeDoc';
import { StringCharSource } from '..';
import { ClassUtil } from '../core/ClassUtil';
import { EOFRuntimeException } from '../core/EOFRuntimeException';

const SPACE_CHARS = " \r";

export class CSVParser {

  public static readonly instance = new CSVParser();
  public static get() { return CSVParser.instance; }

  public static parse(src: CharSource | string, opt: CSVOption): TDNode {
    return CSVParser.get().parse(src, opt);
  }

  public parse(src: CharSource | string, opt: CSVOption = new CSVOption(), root = new TreeDoc('root').root): TDNode {
    if (typeof src === 'string')
      src = new StringCharSource(src);
    let fields: string[] | undefined = undefined;
    root.setType(TDNodeType.ARRAY);
    if (opt.includeHeader) {
      fields = this.readNonEmptyRecord(src, opt).map(f => "" + f);
      if (fields.length == 0)
        return root;
      if (fields[0] === TDNode.COLUMN_KEY)
        root.setType(TDNodeType.MAP);
    }

    while (!src.isEof()) {
      if (!src.skipChars(SPACE_CHARS))
        break;
      this.readRecordToTDNode(src, opt, root, fields);
    }
    return root;
  }

  private readRecordToTDNode(src: CharSource, opt: CSVOption, root: TDNode, fields?: string[]) {
    const row = new TDNode(root.doc).setType(fields == null ? TDNodeType.ARRAY: TDNodeType.MAP);
    row.setStart(src.getBookmark());
    let i = 0;
    while (!src.isEof() && src.peek() != opt.recordSep) {
      if (!src.skipChars(SPACE_CHARS))
        break;
      const start = src.getBookmark();
      const val = this.readField(src, opt);
      let key = undefined;
      if (fields != null) {
        if (i >= fields.length)
          throw src.createParseRuntimeException("The row has more columns than headers");
        key = fields[i++];
        if (key === TDNode.COLUMN_KEY) {
          row.setKey(val!.toString());
          continue;
        }
      }
      const field = row.createChild(key).setValue(val);
      field.setStart(start).setEnd(src.getBookmark());
    }
    row.setEnd(src.getBookmark());
    if (row.hasChildren())
      root.addChild(row);
    if (!src.isEof())
      src.read();  // Skip the recordSep
  }

  public readNonEmptyRecord(src: CharSource, opt: CSVOption): any[] {
    while(!src.isEof()) {
      const res = this.readRecord(src, opt);
      if (res.length > 0)
        return res;
    }
    return [];
  }

  public readRecord(src: CharSource, opt: CSVOption): any[] {
    const result: any[] = [];
    while (!src.isEof() && src.peek() != opt.recordSep) {
      if (!src.skipChars(SPACE_CHARS))
        break;
      result.push(this.readField(src, opt));
    }
    if (!src.isEof())
      src.read();  // Skip the recordSep
    return result;
  }

  readField(src: CharSource, opt: CSVOption): ValueType {
    const sb = new StringBuilder();
    if (src.isEof())
      return sb.toString();

    let isString = false;
    if (src.peek() != opt.quoteChar) {  // Read non-quoted string
      sb.append(src.readUntilTerminator(opt._fieldAndRecord).trim());
    } else {  // Read quoted string
      isString = true;
      src.skip();
      while (!src.isEof() && src.peek() != opt.fieldSep && src.peek() != opt.recordSep) {
        // Not calling getBookmark() to avoid clone an object
        const pos = src.bookmark.pos;
        const line = src.bookmark.line;
        const col = src.bookmark.col

        src.readUntilTerminatorToString(sb, opt.quoteChar);
        if (src.isEof())
          throw src.createParseRuntimeException("Can't find matching quote at position:" + pos + ";line:" + line + ";col:" + col);

        src.skip();
        if (src.isEof())
          break;
        if (src.peek() == opt.quoteChar) {
          sb.append(opt.quoteChar);
          src.skip();
        } else {
          break;
        }
      }
      src.skipSpacesAndReturns();
    }

    if (!src.isEof() && src.peek() == opt.fieldSep)
      src.skip();  // Skip fieldSep

    const str = sb.toString();
    return isString ? str : ClassUtil.toSimpleObject(str);
  }
}
