const toKebabCase = (str) => {
  return str.replace(/[A-Z]/g, (substring, index) => {
    if (index === 0) {
      return substring.toLowerCase();
    }
    return `-${substring.toLowerCase()}`;
  });
};

export default toKebabCase;
