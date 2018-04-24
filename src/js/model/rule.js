import {types} from "mobx-state-tree";
import matchParser from "../tools/matchParser";
import regexpParser from "../tools/regexpParser";

const ruleModel = types.model('rule', {
  parser: types.optional(types.string, 'match'), // regexp, match
  pattern: types.string
}).views(self => {
  return {
    getParser() {
      switch (self.parser.toLowerCase()) {
        case 'match':
          return matchParser;
        case 'regexp':
        default:
          return regexpParser;
      }
    },
    getPatterns() {
      return self.getParser()(self.pattern);
    }
  }
});

export default ruleModel;