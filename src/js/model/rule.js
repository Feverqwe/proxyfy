import {types} from "mobx-state-tree";
import matchParser from "../tools/matchParser";

const ruleModel = types.model('rule', {
  parser: types.optional(types.string, 'match'), // regexp, match
  pattern: types.string
}).views(self => {
  const regexpParser = pattern => {
    return [{
      type: 'regexp',
      pattern: pattern
    }];
  };

  const parser = {
    regexp: regexpParser,
    match: matchParser,
  };

  return {
    getPatterns() {
      return parser[self.parser](self.pattern);
    }
  }
});

export default ruleModel;