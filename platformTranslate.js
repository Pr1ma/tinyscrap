function platformTranslate(input) {
  if (typeof input !== 'string') return 'input must be a string';
  let output;
  switch (input) {
  case 'XB2':
    output = 'Xbox 360';
    break;
  case 'XB3':
    output = 'Xbox One';
    break;
  default:
    output = input;
  }
  return output;
}

module.exports = platformTranslate;
