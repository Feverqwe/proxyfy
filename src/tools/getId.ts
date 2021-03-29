function getId() {
  return [Math.random() * 1000, Math.random() * 1000, Math.random() * 1000].map(Math.trunc).join('');
}

export default getId;
