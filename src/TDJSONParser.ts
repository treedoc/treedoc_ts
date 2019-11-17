import TDNode, { TDNodeType } from './TDNode';
import TDJSONParserOption from './TDJSONParserOption';
import CharSource from './CharSource';
import StringBuilder from './StringBuilder';

export default class TDJSONParser {
  public static readonly instance = new TDJSONParser();
  public static get() {
    return TDJSONParser.instance;
  }

  public parse(opt: TDJSONParserOption): TDNode {
    return this.parseFromSource(opt.source, opt, new TDNode());
  }

  public parseFromSource(src: CharSource, opt: TDJSONParserOption, node: TDNode): TDNode {
    if (!TDJSONParser.skipSpaceAndComments(src)) return node;

    const c = src.peek();
    node.start = src.getBookmark();
    try {
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

      const str = src.readUntilTermintor(',}]\n\r', 0, Number.MAX_VALUE).trim();
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
    while (TDJSONParser.skipSpaceAndComments(src)) {
      const c = src.peek();
      if ('"`\''.indexOf(c) < 0) break;
      src.read();
      src.readQuotedToString(c, sb);
    }
  }

  /**
   * @return true if there's more text left
   */
  public static skipSpaceAndComments(src: CharSource): boolean {
    while (src.skipSpaces()) {
      const c = src.peek();
      if (c === '#') {
        if (src.skipUntilTerminator('\n')) src.skip(1);
        continue;
      }

      if (c !== '/' || src.isEof(1)) return true;
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
          return true;
      }
    }
    return false;
  }

  public parseMap(src: CharSource, opt: TDJSONParserOption, node: TDNode, withStartBracket: boolean): TDNode {
    node.type = TDNodeType.MAP;
    if (withStartBracket) src.read();

    for (let i = 0; ; ) {
      if (!TDJSONParser.skipSpaceAndComments(src)) {
        if (withStartBracket) throw src.createParseRuntimeException("EOF encountered while expecting matching '}'");
        break;
      }

      let c = src.peek();
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
        if (!TDJSONParser.skipSpaceAndComments(src)) break;
        c = src.peek();
        if (c !== ':' && c !== '{' && c !== '[' && c !== ',' && c !== '}')
          throw src.createParseRuntimeException("No ':' after key:" + key);
      } else {
        key = src.readUntilTermintor(':{[,}"', 1, Number.MAX_VALUE).trim();
        if (src.isEof()) throw src.createParseRuntimeException("No ':' after key:" + key);
        c = src.peek();
      }

      if (c === ',' || c === '}')
        // If there's no ':', we consider it as indexed value (array)
        node.createChild(i + '').setValue(key);
      else {
        if (c === ':') src.read();
        this.parseFromSource(src, opt, node.createChild(key));
      }
      i++;
    }
    return node;
  }

  private parseArray(src: CharSource, opt: TDJSONParserOption, node: TDNode, withStartBracket: boolean): TDNode {
    node.type = TDNodeType.ARRAY;
    if (withStartBracket) src.read();
    while (true) {
      if (!TDJSONParser.skipSpaceAndComments(src)) {
        if (withStartBracket) throw src.createParseRuntimeException("EOF encountered while expecting matching ']'");
        break;
      }

      const c = src.peek();
      if (c === ']') {
        src.read();
        break;
      }

      if (c === ',') {
        src.read();
        continue;
      }

      this.parseFromSource(src, opt, node.createChild());
    }
    return node;
  }

  private parseNumber(str: string, isHex: boolean): number | string {
    const num = !isHex && str.indexOf('.') >= 0 ? parseFloat(str) : parseInt(str, isHex ? 16 : 10);
    return Number.isNaN(num) ? str : num;
  }
}
