export class TestData {
testData = `
// Some comments
{\u00a0
  "total": 100000000000000000000,
  "maxSafeInt": 9007199254740991,
  "limit": 10,
  "valueWithoutKey",

  /* block comments */
  "data": [
    {
      "$id": "1",
      "name": "Some Name 1",  // More line comments
      "address": {
        "streetLine": "1st st",
        city: "san jose",
      },
      "createdAt": "2017-07-14T17:17:33.010Z",
      'ip': 10.1.22.22
    },
    {
      "$id": "2",
      "name": "Some Name 2",
      "address": /*comments*/ {
        "streetLine": "2nd st",
        city: "san jose",
      },
      "createdAt": "2017-07-14T17:17:33.010Z",
    },
    \`Multiple line literal
    Line2\`
  ],
  "objRef": {"$ref": "1"},
  lastValueWithoutKey
}`;

proto = `
n: {
  n1: {
    n11: 1
    # Duplicated key; ':' is emitted before '{'
    n11 {
      n111: false
    }
    n12: "2"
  }
  # Multi-line comments
  # Line2
  ########
  n1: {
    n11: "abcd"
    #  Extension keys
    [d.e.f]: 4
    n11: "multiline 1\n"
    'line2'
  }
  n2: [1,2,3]
  n2 [3,4,5]  # ':' is emitted before '['
  "n3" [6, 7, 8, 9]
  noVal:
}`;

JSON5 = `
  // https://spec.json5.org/
  {
    // comments
    unquoted: 'and you can quote me on that',
    singleQuotes: 'I can use "double quotes" here',
    lineBreaks: "Look, Mom! \
  No \\n's!",
    hexadecimal: 0xdecaf,
    leadingDecimalPoint: .8675309, andTrailing: 8675309.,
    positiveSign: +1,
    trailingComma: 'in objects', andIn: ['arrays',],
    "backwardsCompatible": "with JSON",
  }`;

stream = `
{"a": 1, "obj": {"$id": 1}, "ref":  {"$ref":  "#1"}}
{"b": 2, "obj": {"$id": 1}, "ref":  {"$ref":  "#1"}},
a:1
b:2
`
}