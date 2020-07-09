import TDNode, { TDNodeType } from '../TDNode';
import TDJSONParserOption from './TDJSONParserOption';
import CharSource from './CharSource';
import StringBuilder from './StringBuilder';
import TreeDoc from '../TreeDoc';

const EOF = '\uFFFF';

export default class TDJSONParser {
  public static readonly instance = new TDJSONParser();
  public static get() {
    return TDJSONParser.instance;
  }

  public static parse(opt: TDJSONParserOption | CharSource | string): TDNode {
    return TDJSONParser.get().parse(opt);
  }

  public static parseFromSource(src: CharSource, opt: TDJSONParserOption, node: TDNode): TDNode {
    return TDJSONParser.get().parseFromSource(src, opt, node);
  }

  public parse(opt: TDJSONParserOption | CharSource | string): TDNode {
    return opt instanceof CharSource || typeof opt === 'string'
      ? this.parse(new TDJSONParserOption(opt))
      : this.parseFromSource(opt.source, opt, new TreeDoc('root', opt.uri).root);
  }

  public parseFromSource(src: CharSource, opt: TDJSONParserOption, node: TDNode): TDNode {
    const c = TDJSONParser.skipSpaceAndComments(src);
    if (c === EOF) return node;

    try {
      node.start = src.getBookmark();

      if (c === '{') return this.parseMap(src, opt, node, true);

      if (c === '[') return this.parseArray(src, opt, node, true);

      if (node.isRoot()) {
        switch (opt.defaultRootType) {
          case TDNodeType.MAP:
            return this.parseMap(src, opt, node, false);
          case TDNodeType.ARRAY:
            return this.parseArray(src, opt, node, false);
        }
      }

      if (c === '"' || c === "'" || c === '`') {
        src.read();
        const sb = new StringBuilder();
        src.readQuotedToString(c, sb);
        this.readContinuousString(src, sb);
        return node.setValue(sb.toString());
      }

      let term = ',\n\r';
      if (node.parent != null)
        // parent.type can either by ARRAY or MAP.
        term = node.parent.type === TDNodeType.ARRAY ? ',\n\r]' : ',\n\r}';

      const str = src.readUntilTerminator(term, 0, Number.MAX_VALUE).trim();
      if ('null' === str) return node.setValue(null);
      if ('true' === str) return node.setValue(true);
      if ('false' === str) return node.setValue(false);
      if (str.startsWith('0x') || str.startsWith('0X')) return node.setValue(this.parseNumber(str.substring(2), true));
      if (c === '-' || c === '+' || c === '.' || (c >= '0' && c <= '9'))
        return node.setValue(this.parseNumber(str, false));
      return node.setValue(str);
    } finally {
      node.end = src.getBookmark();
    }
  }

  private readContinuousString(src: CharSource, sb: StringBuilder): void {
    let c;
    while ((c = TDJSONParser.skipSpaceAndComments(src)) !== EOF) {
      if ('"`\''.indexOf(c) < 0) break;
      src.read();
      src.readQuotedToString(c, sb);
    }
  }

  /**
   * @return char next char to read (peeked), if '\uFFFF' indicate it's EOF
   */
  public static skipSpaceAndComments(src: CharSource): string {
    while (src.skipSpaces()) {
      const c = src.peek();
      if (c === '#') {
        if (src.skipUntilTerminator('\n')) src.skip(1);
        continue;
      }

      if (c !== '/' || src.isEof(1)) return c;
      const c1 = src.peek(1);
      switch (c1) {
        case '/': // line comments
          if (src.skipUntilTerminator('\n')) src.skip(1);
          break;
        case '*': // block comments
          src.skip(2);
          src.skipUntilMatch('*/', true);
          break;
        default:
          return c1;
      }
    }
    return EOF;
  }

  public parseMap(src: CharSource, opt: TDJSONParserOption, node: TDNode, withStartBracket: boolean): TDNode {
    node.type = TDNodeType.MAP;
    if (withStartBracket) src.read();

    for (let i = 0; ; ) {
      let c = TDJSONParser.skipSpaceAndComments(src);
      if (c === EOF) {
        if (withStartBracket) throw src.createParseRuntimeException("EOF encountered while expecting matching '}'");
        break;
      }

      if (c === '}') {
        src.read();
        break;
      }

      if (c === ',') {
        // Skip ,
        src.read();
        continue;
      }

      let key;
      if (c === '"' || c === "'" || c === '`') {
        src.read();
        key = src.readQuotedString(c);
        c = TDJSONParser.skipSpaceAndComments(src);
        if (c === EOF) break;
        if (c !== ':' && c !== '{' && c !== '[' && c !== ',' && c !== '}')
          throw src.createParseRuntimeException("No ':' after key:" + key);
      } else {
        key = src.readUntilTerminator(':{[,}"', 1, Number.MAX_VALUE).trim();
        if (src.isEof()) throw src.createParseRuntimeException("No ':' after key:" + key);
        c = src.peek();
      }
      if (c === ':') src.read();

      if (c === ',' || c === '}')
        // If there's no ':', we consider it as indexed value (array)
        node.createChild(i + '').setValue(key);
      else {
        const childNode = this.parseFromSource(src, opt, node.createChild(key));
        if (opt.KEY_ID === key && childNode.type === TDNodeType.SIMPLE) node.doc.idMap[childNode.value + ''] = node;
      }
      i++;
    }
    return node;
  }

  private parseArray(src: CharSource, opt: TDJSONParserOption, node: TDNode, withStartBracket: boolean): TDNode {
    node.type = TDNodeType.ARRAY;
    if (withStartBracket) src.read();
    while (true) {
      let c = TDJSONParser.skipSpaceAndComments(src);
      if (c === EOF) {
        if (withStartBracket) throw src.createParseRuntimeException("EOF encountered while expecting matching ']'");
        break;
      }

      if (c === ']') {
        src.read();
        break;
      }

      this.parseFromSource(src, opt, node.createChild());
      c = TDJSONParser.skipSpaceAndComments(src);
      if (c === ',') {
        src.read();
      }
    }
    return node;
  }

  private parseNumber(str: string, isHex: boolean): number | string {
    const isDouble = !isHex && str.indexOf('.') >= 0;
    const num = isDouble ? parseFloat(str) : parseInt(str, isHex ? 16 : 10);
    return Number.isNaN(num) || (!isDouble && num > Number.MAX_SAFE_INTEGER) ? str : num;
  }
}
