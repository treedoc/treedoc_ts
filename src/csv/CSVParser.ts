import TDNode, { TDNodeType } from '../TDNode';
import CSVOption from './CSVOption';
import CharSource from '../core/CharSource';
import StringBuilder from '../core/StringBuilder';
import TreeDoc from '../TreeDoc';
import { StringCharSource } from '..';

const SPACE_CHARS = " \r";

export default class CSVParser {

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
    const row = new TDNode(root.doc);
    row.setStart(src.getBookmark());
    while(!src.isEof() && src.peek() !== opt.recordSep) {
      if (!src.skipChars(SPACE_CHARS))
        break;
      const start = src.getBookmark();
      const fieldNode = row.createChild().setType(TDNodeType.ARRAY).setValue(this.readField(src, opt));
      fieldNode.setStart(start).setEnd(src.getBookmark());
    }
    row.setEnd(src.getBookmark());
    if (row.getChildrenSize() > 0)
      root.addChild(row);
    if (!src.isEof())
      src.read();  // Skip the recordSep
  }

  readField(source: CharSource, opt: CSVOption): string {
    const sb = new StringBuilder();
    let previousQuoted = false;
    while(!source.isEof() && source.peek() !== opt.fieldSep && source.peek() !== opt.recordSep) {
      if (source.peek() === opt.quoteChar) {
        if (previousQuoted)
          sb.append(opt.quoteChar);
        source.skip();  // for "", we will keep one quote
        source.readUntilTerminatorToString(opt.quoteChar, sb);
        if (source.peek() === opt.quoteChar)
          source.skip();
        previousQuoted = true;
      } else {
        sb.append(source.readUntilTerminator(opt.fieldSep + opt.recordSep).trim());
        previousQuoted = false;
      }
    }
    if (!source.isEof() && source.peek() === opt.fieldSep)
      source.skip();  // Skip fieldSep

    return sb.toString();
  }
}
