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

const gamebuyPlatformsPattern = /(\[X360\])|(\[Xbox One\])|(\[Wii U\])|(\[Wii\])|(\[NSwitch\])|(\[3DS\])|(\[NDS\])|(\[PS3\])|(\[PS4\])/;
const viPlatformPattern = /(PS3)|(PS3 Move)|(PS3 MOVE)|(Nintendo Wii U)|(Nintendo 3DS)|(3DS)|(New Nintendo 3DS)|(Ps Vita)|(Xbox One)|(PS4)|(PSVR)|(PS4\/PSVR)|(Nintendo Switch)/;

const removeGbPlatform = input =>
  input.replace(gamebuyPlatformsPattern, '').trim();

const removeViPlatform = input => input.replace(viPlatformPattern, '').trim();

const removeBrackets = input => {
  const brackets = /\[|\]|\(|\)/g;
  return input.replace(brackets, '');
};

const gcuPlatformTranslate = input => {
  if (typeof input !== 'string') return 'input must be a string';
  let output;
  switch (input) {
  case 'PS4':
    output = '[PS4]';
    break;
  case 'PS3':
    output = '[PS3]';
    break;
  case 'XB2':
    output = '[X360]';
    break;
  case 'XB3':
    output = '[Xbox One]';
    break;
  case 'WIU':
    output = '[Wii U]';
    break;
  case 'WII':
    output = '[Wii]';
    break;
  case 'NSW':
    output = '[NSwitch]';
    break;
  case 'PSV':
    output = '[PS Vita]';
    break;
  case '3DS':
    output = '[3DS]';
    break;
  case 'NDS':
    output = '[NDS]';
    break;
  default:
    output = input;
  }
  return output;
};

const viPlatformTranslate = input => {
  if (typeof input !== 'string') return 'input must be a string';
  let output;
  switch (input) {
  case 'Nintendo Switch':
    output = 'NSwitch';
    break;
  case 'PS Vita':
    output = 'PS Vita';
    break;
  case 'Nintendo 3DS':
    output = '3DS';
    break;
  case 'Nintendo Wii U':
    output = 'Wii U';
    break;
  default:
    output = input;
  }
  return output;
};

//Вероятно search() здесь избыточен
const gcuTitleNormalizer = title =>
  title.search(/ - Only at GAME/) !== -1
    ? title.replace(' - Only at GAME', '')
    : title;

const fromGbpToRubPrice = (price, exchangeRate) => {
  const result = Math.round(price.replace('£', '') * exchangeRate / 50) * 50;
  return result;
};

//сделать trim + tolowercase + переименовать
//сделать массив платформ
const getVideoigrPlatform = input => {
  const platforms = /(PS3)|(Nintendo Wii U)|(Nintendo 3DS)|(PS Vita)|(Xbox One)|(PS4)|(Nintendo Switch)/;
  const result = platforms.exec(input);
  if (result === null) return;
  return viPlatformTranslate(result[0]);
};

const viEngPattern = /\(Eng\)|Engl|\[US\]|\[USA\]|\[English ver.\]/;
const viRusPattern = /\(Русская версия\)|\[Русская\/Engl.vers.\]/;
const viOrigPattern = /\[AS\]|\[ASIA\]|\[Asia\/English\]/;
//при удалении языка из тайтла использовать до того как будут убраны brackets
const videoigrLaguage = (inputTitle, remove) => {
  if (remove) {
    //В этом чайне рус должен стоять в начале
    return inputTitle
      .replace(viRusPattern, '')
      .replace(viEngPattern, '')
      .replace(viOrigPattern, '');
  }

  return inputTitle.search(viRusPattern) > -1
    ? 'русский язык'
    : inputTitle.search(viEngPattern) > -1
      ? 'английский язык'
      : inputTitle.search(viOrigPattern) > -1
        ? 'язык оригинала'
        : 'английский язык';
};

const removeArrayDoublicates = (originalArray, prop) => {
  let newArray = [];
  let lookupObject = {};

  for (let i in originalArray) {
    lookupObject[originalArray[i][prop]] = originalArray[i];
  }

  for (let i in lookupObject) {
    newArray.push(lookupObject[i]);
  }

  return newArray;
};

module.exports.tomorrow = tomorrow;
module.exports.gcuPlatformTranslate = gcuPlatformTranslate;
module.exports.gcuTitleNormalizer = gcuTitleNormalizer;
module.exports.fromGbpToRubPrice = fromGbpToRubPrice;
module.exports.getVideoigrPlatform = getVideoigrPlatform;
// module.exports.getGcuEdition = getGcuEdition;
module.exports.removeGbPlatform = removeGbPlatform;
module.exports.removeViPlatform = removeViPlatform;
module.exports.removeBrackets = removeBrackets;
module.exports.removeArrayDoublicates = removeArrayDoublicates;
module.exports.videoigrLaguage = videoigrLaguage;
