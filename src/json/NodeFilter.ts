import { TDNode, TDNodeType } from "..";
import ListUtil from "../core/ListUtil";

/** if it returns undefined, node will be skipped */
abstract class NodeFilter {
  abstract apply(n: TDNode): TDNode | undefined;
  static exclude(...patterns: string[]): ExcludeFilter { return new ExcludeFilter(...patterns); }
  static mask(...patterns: string[]): MaskFilter { return new MaskFilter(...patterns); }
};

export default NodeFilter;

abstract class RegexFilter implements NodeFilter {
  public readonly pathPatterns:RegExp[] = [];
  abstract transform(n: TDNode): TDNode | undefined;
  public constructor(...strPatterns: string[]) { this.addPatterns(...strPatterns); }
  public apply(n: TDNode): TDNode | undefined {
    if (!this.matches(n.pathAsString))
      return n;
    return this.transform(n);
  }

  private addPatterns(...patterns: string[]) {
    if (patterns != null)
      for (const ptn of patterns)
        this.pathPatterns.push(new RegExp(ptn));
  }

  private matches(path: string): boolean {
    return ListUtil.exists(this.pathPatterns, p => p.test(path));
  }
}

class ExcludeFilter extends RegexFilter {
  public constructor(... patterns: string[]) { super(...patterns); }
  transform(n: TDNode): TDNode | undefined { return undefined; }
}

class MaskFilter extends RegexFilter {
  constructor(...patterns: string[]) {super(...patterns);}
  transform(n: TDNode): TDNode | undefined {
    if (n.value == null && !n.hasChildren())
      return n;
    return n.cloneOfSimpleType(this.getMaskStr(n));
  }
  private getMaskStr(n: TDNode): string  {
    switch (n.type) {
      case TDNodeType.SIMPLE: return "<Masked:len=" + n.value?.toString().length + ">";
      case TDNodeType.MAP: return "{Masked:size=" + n.getChildrenSize() + "}";
      case TDNodeType.ARRAY: return "[Masked:length=" + n.getChildrenSize() + "]";
    }
    return "[Masked]";  // Shouldn't happen
  }
}
