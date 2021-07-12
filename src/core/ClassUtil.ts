export class ClassUtil {
 /**
  * To Simple Object without type. It will to convert str into null, boolean, double, long or Integer.
  * For number, it supports Hex number with prefix of "0x". If conversion fails. It will return the original str.
  */
  public static toSimpleObject(str: string): number | boolean | string | null {
    if ("null" === str)
      return null;
    if ("true" === str)
      return true;
    if ("false" === str)
      return false;
    return this.tryToNumber(str);
  }

  private static tryToNumber(str: string): number | boolean | string {
    if (str.length > 0) {
      return this.parseNumber(str);
    }
    return str;
  }

  private static parseNumber(str: string): number | string {
    const isDouble = str.indexOf('.') >= 0;
    const num = Number(str);
    return Number.isNaN(num) || (!isDouble && num > Number.MAX_SAFE_INTEGER) ? str : num;
  }
}