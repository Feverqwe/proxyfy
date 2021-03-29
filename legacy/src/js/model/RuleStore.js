import {types} from "mobx-state-tree";
import matchPacParser from "../tools/matchPacParser";
import regexpParser from "../tools/regexpParser";
import matchParser from "../tools/matchParser";

/**
 * @typedef {{}} RuleStore
 * @property {string} [parser]
 * @property {string} pattern
 * @property {function} getPacParser
 * @property {function} getParser
 * @property {function} getPacPatterns
 * @property {function} getPatterns
 */
const RuleStore = types.model('RuleStore', {
  parser: types.optional(types.string, 'match'), // regexp, match
  pattern: types.string
}).views(self => {
  return {
    getPacParser() {
      switch (self.parser.toLowerCase()) {
        case 'match':
          return matchPacParser;
        case 'regexp':
        default:
          return regexpParser;
      }
    },
    getParser() {
      switch (self.parser.toLowerCase()) {
        case 'match':
          return matchParser;
        case 'regexp':
        default:
          return () => [];
      }
    },
    getPacPatterns() {
      return self.getPacParser()(self.pattern);
    },
    getPatterns() {
      return self.getParser()(self.pattern);
    }
  }
});

export default RuleStore;