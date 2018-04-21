import {types} from "mobx-state-tree";

// regexp https://docs.microsoft.com/ru-ru/dotnet/standard/base-types/regular-expression-language-quick-reference
// micromatch https://github.com/micromatch/micromatch

const ruleModel = types.model('rule', {
  parser: types.string, // regexp, micromatch
  pattern: types.string
}).views(self => {
  const regexpParser = pattern => pattern;

  const micromatchParser = pattern => {
    return pattern;
  };

  const parser = {
    regexp: regexpParser,
    micromatch: micromatchParser,
  };

  return {
    getPattern() {
      return parser[self.parser](self.pattern);
    }
  }
});

export default ruleModel;