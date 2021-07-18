import { ClassUtil } from "../ClassUtil";

describe('ClassUtil', () => {
  
  test('testToSimpleObjectWithoutType', () => {
    expect(ClassUtil.toSimpleObject("1")).toBe(1);
    expect(ClassUtil.toSimpleObject("1000000000000")).toBe(1000000000000);

    expect(ClassUtil.toSimpleObject("1.0")).toBe(1.0);
    expect(ClassUtil.toSimpleObject("true")).toBe(true);
    expect(ClassUtil.toSimpleObject("false")).toBe(false);
    expect(ClassUtil.toSimpleObject("0x11")).toBe(0x11);
    expect(ClassUtil.toSimpleObject("0X11")).toBe(0X11);
    expect(ClassUtil.toSimpleObject("1.1.1.1")).toBe("1.1.1.1");
  });
});
