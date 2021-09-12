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

    root.setType(TDNodeType.ARRAY);
    while (!src.isEof()) {
      if (!src.skipChars(SPACE_CHARS))
        break;
      this.readRecord(src, opt, root);
    }
    return root;
  }

  readRecord(src: CharSource, opt: CSVOption, root: TDNode) {
    const row = new TDNode(root.doc).setType(TDNodeType.ARRAY);
    row.setStart(src.getBookmark());
    while(!src.isEof() && src.peek() !== opt.recordSep) {
      if (!src.skipChars(SPACE_CHARS))
        break;
      const start = src.getBookmark();
      const fieldNode = row.createChild().setValue(this.readField(src, opt));
      fieldNode.setStart(start).setEnd(src.getBookmark());
    }
    row.setEnd(src.getBookmark());
    if (row.getChildrenSize() > 0)
      root.addChild(row);
    if (!src.isEof())
      src.read();  // Skip the recordSep
  }

  readField(src: CharSource, opt: CSVOption): ValueType {
    const sb = new StringBuilder();
    let previousQuoted = false;
    let isString = false;
    while(!src.isEof() && src.peek() !== opt.fieldSep && src.peek() !== opt.recordSep) {
      if (src.peek() === opt.quoteChar) {
        isString = true;
        if (previousQuoted)
          sb.append(opt.quoteChar);
        // Not calling getBookmark() to avoid clone an object
        const {pos, line, col} = src.bookmark;
        src.skip();  // for "", we will keep one quote
        src.readUntilTerminatorToString(opt.quoteChar, sb);
        if (src.isEof())
          throw new EOFRuntimeException("Can't find matching quote at position:" + pos + ";line:" + line + ";col:" + col);
        if (src.peek() === opt.quoteChar)
          src.skip();
        previousQuoted = true;
      } else {
        sb.append(src.readUntilTerminator(opt.fieldSep + opt.recordSep).trim());
        previousQuoted = false;
      }
    }
    if (!src.isEof() && src.peek() === opt.fieldSep)
      src.skip();  // Skip fieldSep

    const str = sb.toString();
    return isString ? str : ClassUtil.toSimpleObject(str);
  }
}
