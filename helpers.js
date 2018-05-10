const tomorrow = date => {
  let dd = date.getDate() + 1;
  let mm = date.getMonth() + 1;
  let yyyy = date.getFullYear();
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  return dd + '/' + mm + '/' + yyyy;
};

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
  case 'WIU':
    output = 'Wii U';
    break;
  case 'WII':
    output = 'Wii';
    break;
  case 'NSW':
    output = 'NSwitch';
    break;
  default:
    output = input;
  }
  return output;
}

//Вероятно search() здесь избыточен
const gcuTitleNormalizer = title =>
  title.search(/ - Only at GAME/) !== -1
    ? title.replace(' - Only at GAME', '')
    : title;

const fromGbpToRubPrice = (price, exchangeRate) => {
  const result = Math.round(price.replace('£', '') * exchangeRate / 50) * 50;
  return result;
};

module.exports.tomorrow = tomorrow;
module.exports.platformTranslate = platformTranslate;
module.exports.gcuTitleNormalizer = gcuTitleNormalizer;
module.exports.fromGbpToRubPrice = fromGbpToRubPrice;
