export default class ListUtil {
  public static exists<V>(source: V[], pred: (t: V) => boolean): boolean {
    return source == null ? false : this.first(source, pred) !== undefined;
  }

  public static first<V>(source: V[], pred: (t: V) => boolean): V | undefined {
    if (source != null)
      for (const s of source)
        if (pred(s))
          return s;
    return undefined;
  }
}