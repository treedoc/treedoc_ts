<a href="https://github.com/treedoc/treedoc_ts"><img alt="GitHub Actions status" src="https://github.com/treedoc/treedoc_ts/workflows/Node%20CI/badge.svg"></a> [![codecov](https://codecov.io/gh/treedoc/treedoc_ts/branch/master/graph/badge.svg)](https://codecov.io/gh/treedoc/treedoc_ts)

# Treedoc

Treedoc is an abstraction for tree-structured file formats such as JSON, YAML, and XML. It defines a simple object model similar to DOM for XML. But as an abstraction, the model itself is format agnostic. With this abstraction, it decouples the application from particular formats for configuration, persistent and communication serialization, etc. This allows the application to switch to different formats easily.

This library is an implementation of Treedoc with typescript. It also includes a parser for JSONex as a reference implementation for Treedoc model.

## Background

Data serialization / de-serialization for configuration, persistent and communication are critical parts for almost any applications. The text-based serialization formats become more and more popular due to its simplicity. The formats have been evolved for many generations, from proprietary implementation to XML, YAML, and JSON, etc. Usually, the decision of which format is critical as once it's decided, the application will be coupled with the format. To switch to different format will be a huge refactor effort. However, the particular format shouldn't be the critical decision and the format will keep evolving. So it's important to decouple the application from particular formats. Treedoc is the solution for this decoupling.

## JSONex

JSONex is a JSON extension format that makes JSON more friendly for configuration and persistent. This is a typescript port from Java implementation. Please refer to [JSONex](https://github.com/eBay/jsonex/blob/master/JSONEX.md) spec for more details.

## Usage

### Basic Usage

```js
import { TDJSONParser, TDJSONParserOption, TDNodeType } from 'treedoc';

const o1 = TDJSONParser.get().parse(new TDJSONParserOption(jsonStr)).toObject();
```

### Advanced Usage

Please refer to the test class [TDJsonParser.spec.ts](src/__tests__/json/TDJsonParser.spec.ts) for more details.

## Live Demo

<http://treedoc.org>

## License

Copyright 2019-2020 Jianwu Chen <BR>
Author/Developer: Jianwu Chen

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
