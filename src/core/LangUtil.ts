export type Constructor = (...args: any[]) => any;  // Add just to avoid JS Lint complain

export default class LangUtil {
  public static doIfNotNull<T>(obj: T | undefined, action: (obj: T) => void) { if (obj !== undefined && obj !== null)  action(obj); }
  public static doIf(condition: boolean, action: () => void) { if (condition) action(); }

// TS_SPECIFIC
  public static EnumValues(enumType: any) {
    return Object.keys(enumType).filter(key => !isNaN(Number(enumType[key])));
  }

  public staticEnumsValueOf(enumType: any, value: number|string) {
    return enumType[value];
  }
}

