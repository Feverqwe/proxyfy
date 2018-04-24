const regexpParser = pattern => {
  return [{
    type: 'regexp',
    pattern: pattern
  }];
};

export default regexpParser;