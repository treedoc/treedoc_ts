import { StringCharSource } from "../StringCharSource";

describe('StringCharSource', () => {
  
  test('testReadQuotedStringError', () => {
    const cs = new StringCharSource("'Missing closing quote");
    const c = cs.read();  // skip first quote
    try {
      cs.readQuotedString(c);
      fail("Should throw error");
    } catch(e: any) {
      expect(e.message).toBe("Can't find matching quote at position:1;line:0;col:1");
      // e.printStackTrace();
    }
  });
});
