[![CircleCI](https://circleci.com/gh/treedoc/treedoc_ts.svg?style=svg)](https://circleci.com/gh/treedoc/treedoc_ts)
[![codecov](https://codecov.io/gh/treedoc/treedoc_ts/branch/master/graph/badge.svg)](https://codecov.io/gh/treedoc/treedoc_ts)

# JSONEX parser in Type Script

JSONEX Make JSON greate again for configuration

## Overview

Jsonex is a json extension format makes JSON more friendly for configuration. This is a typescript port from Java implementation. Please refer to [JSONEX](https://github.com/eBay/jsonex/blob/master/JSONEX.md) spec for more details.

## Usage

### Basic Usage
```js
import { TDJSONParser, TDJSONParserOption, TDNodeType } from 'jsonex-treedoc';

const o1 = TDJSONParser.get().parse(new TDJSONParserOption(jsonStr)).toObject();
```
### Advanced Usage
Please refere to the test class [JsonParser.test.ts](src/__tests__/TDJsonParser.test.ts) for more details.

## Live Demo

https://jsontable.github.io/
