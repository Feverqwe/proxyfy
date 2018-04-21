import {types} from "mobx-state-tree";

// regexp https://docs.microsoft.com/ru-ru/dotnet/standard/base-types/regular-expression-language-quick-reference
// micromatch https://github.com/micromatch/micromatch

const ruleModel = types.model('rule', {
  parser: types.string, // regexp, micromatch
  pattern: types.string
});

export default ruleModel;