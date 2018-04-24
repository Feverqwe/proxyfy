const matchParser = pattern => {
  const patterns = [];

  patterns.push(pattern);
  if (/^\*\./.test(pattern.substr(2))) {
    patterns.push(pattern);
  }

  return patterns;
};

export default matchParser;