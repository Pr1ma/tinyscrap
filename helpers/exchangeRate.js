const helpers = require('../src/helpers');
const parseString = require('xml2js').parseString;
const http = require('http');
// const cache = require('memory-cache');

// из-за require приходится городить объект
const exchangeRate = { value: 100 };

function getRate(callback) {
  http.get(
    `http://www.cbr.ru/scripts/XML_daily.asp?date_req=${helpers.tomorrow(
      new Date()
    )}`,
    res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res
        .on('end', () => {
          parseString(data, (err, res2) => {
            let rate = parseFloat(
              res2.ValCurs.Valute[2].Value[0].replace(',', '.')
            );
            callback(rate);
          });
        })
        .on('error', err => {
          /* eslint-disable-next-line no-console */
          console.log('getRate Error', err.message);
          throw err;
        });
    }
  );
}

new Promise(res => getRate(res))
  .then(result => (exchangeRate.value = result))
  /* eslint-disable-next-line no-console */
  .then(result => console.log('Exchange = ', result));

module.exports = exchangeRate;
