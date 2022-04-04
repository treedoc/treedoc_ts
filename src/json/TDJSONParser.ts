import { TDNode, TDNodeType } from '../TDNode';
import { TDJSONParserOption } from './TDJSONParserOption';
import { CharSource } from '../core/CharSource';
import { StringCharSource } from '../core/StringCharSource';
import { StringBuilder } from '../core/StringBuilder';
import { TreeDoc } from '../TreeDoc';
import { ClassUtil } from '../core/ClassUtil';
import { RecursivePartial } from '../core/LangUtil';
import { LangUtil } from '..';

const EOF = '\uFFFF';

export class TDJSONParser {
  public static readonly instance = new TDJSONParser();
  public static get() {
    return TDJSONParser.instance;
  }

  /** Parse all the JSON objects in the input stream until EOF and store them inside an root node with array type */
  public parseAll(src: CharSource | string, 
      option:RecursivePartial<TDJSONParserOption> = new TDJSONParserOption(), 
      node = new TreeDoc('root', option.uri).root, isRoot = true): TDNode {
    const opt = option instanceof TDJSONParserOption ? option : LangUtil.mergeDeep(new TDJSONParserOption(), option);

    if (typeof src === 'string')
      src = new StringCharSource(src);

    const doc = TreeDoc.ofArray();
    let docId = 0;
    while(src.skipSpacesAndReturnsAndCommas())
      TDJSONParser.get().parse(src, opt.setDocId(docId++), doc.root.createChild());
    return doc.root;
  }

  public parse(src: CharSource | string, 
      option: RecursivePartial<TDJSONParserOption> = new TDJSONParserOption(), 
      node = new TreeDoc('root', option.uri).root, isRoot = true): TDNode {
    const opt = option instanceof TDJSONParserOption ? option : LangUtil.mergeDeep(new TDJSONParserOption(), option);

    if (typeof src === 'string')
      src = new StringCharSource(src);

    const c = TDJSONParser.skipSpaceAndComments(src);
    if (c === EOF) 
      return node;

    try {
      node.start = src.getBookmark();

      if (c === '{')  
        return this.parseMap(src, opt, node, true);

      if (c === '[')
        return this.parseArray(src, opt, node, true);

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
        src.readQuotedToString(sb, c);
        this.readContinuousString(src, sb);
        return node.setValue(sb.toString());
      }

      let term = opt.termValue;
      if (node.parent != null)
        // parent.type can either by ARRAY or MAP.
        term = node.parent.type === TDNodeType.ARRAY ? opt.termValueInArray : opt.termValueInMap;

      const str = src.readUntilTerminator(term, opt.termValueStrs).trim();
      return node.setValue(ClassUtil.toSimpleObject(str));
    } finally {
      node.end = src.getBookmark();
    }
  }

  private readContinuousString(src: CharSource, sb: StringBuilder): void {
    let c;
    while ((c = TDJSONParser.skipSpaceAndComments(src)) !== EOF) {
      if ('"`\''.indexOf(c) < 0)
        break;
      src.read();
      src.readQuotedToString(sb, c);
    }
  }

  /**
   * @return char next char to read (peeked), if '\uFFFF' indicate it's EOF
   */
  public static skipSpaceAndComments(src: CharSource): string {
    while (src.skipSpacesAndReturns()) {
      const c = src.peek();
      if (c === '#') {
        if (src.skipUntilTerminator('\n'))
          src.skip(1);
        continue;
      }

      if (c !== '/' || src.isEof(1)) return c;
      const c1 = src.peek(1);
      switch (c1) {
        case '/': // line comments
          if (src.skipUntilTerminator('\n'))
            src.skip(1);
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
    if (withStartBracket)
      src.skip();

    for (let i = 0; ; ) {
      let c = TDJSONParser.skipSpaceAndComments(src);
      if (c === EOF) {
        if (withStartBracket)
          throw src.createParseRuntimeException("EOF while expecting matching '}' with '{' at " + node.start);
        break;
      }

      if (c === '}') {
        src.skip();
        break;
      }

      if (src.startsWith(opt.deliminatorValue)) { // Skip ,
        src.skip(opt.deliminatorValue.length);
        continue;
      }

      let key;
      if (c === '"' || c === "'" || c === '`') {
        src.skip();
        key = src.readQuotedString(c);
        c = TDJSONParser.skipSpaceAndComments(src);
        // if (c === EOF)
        //   break;
        if (!src.startsWith(opt.deliminatorKey) && c !== '{' && c !== '[' && c !== ',' && c !== '}')
          throw src.createParseRuntimeException(`No '${opt.deliminatorKey}' after key:${key}`);
      } else {
        key = src.readUntilTerminator(opt.termKey, opt.termKeyStrs, 1, Number.MAX_VALUE).trim();
        if (src.isEof())
          throw src.createParseRuntimeException(`No '${opt.deliminatorKey}' after key:${key}`);
        c = src.peek();
      }
      if (src.startsWith(opt.deliminatorKey))
        src.skip(opt.deliminatorKey.length);

      if (src.startsWith(opt.deliminatorValue) || c === '}')
        // If there's no ':', we consider it as indexed value (array)
        node.createChild(i + '').setValue(key);
      else {
        const childNode = this.parse(src, opt, node.createChild(key), false);
        if (opt.KEY_ID === key && childNode.type === TDNodeType.SIMPLE) {
          let id = childNode.value + '';
          if (opt.docId !== undefined) {
            id += "_" + opt.docId;
            childNode.value = id;
          }
          node.doc.idMap[id] = node;
        } else if (TDNode.REF_KEY === key && childNode.type === TDNodeType.SIMPLE) {
          if (opt.docId !== undefined)
            childNode.value += "_" + opt.docId;
        }   
      }
      i++;
    }
    return node;
  }

  private parseArray(src: CharSource, opt: TDJSONParserOption, node: TDNode, withStartBracket: boolean): TDNode {
    node.type = TDNodeType.ARRAY;
    if (withStartBracket)
      src.skip();
    while (true) {
      let c = TDJSONParser.skipSpaceAndComments(src);
      if (c === EOF) {
        if (withStartBracket)
          throw src.createParseRuntimeException("EOF while expecting matching ']' with '[' at " + node.start);
        break;
      }

      if (c === ']') {
        src.skip();
        break;
      }

      this.parse(src, opt, node.createChild(), false);
      c = TDJSONParser.skipSpaceAndComments(src);
      if (src.startsWith(opt.deliminatorValue)) {
        src.skip(opt.deliminatorValue.length);
      }    
    }
    return node;
  }
}
