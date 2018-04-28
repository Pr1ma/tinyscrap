const http = require('http');
const parseString = require('xml2js').parseString;

const tomorrow = date => {
  let dd = date.getDate() + 1; //We need tomorrow
  let mm = date.getMonth() + 1; //Month starts at 0!
  let yyyy = date.getFullYear();

  if (dd < 10) {
    dd = '0' + dd;
  }

  if (mm < 10) {
    mm = '0' + mm;
  }

  return dd + '/' + mm + '/' + yyyy;
};

function getRate(callback) {
  http.get(
    `http://www.cbr.ru/scripts/XML_daily.asp?date_req=${tomorrow(new Date())}`,
    res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res
        .on('end', () => {
          parseString(data, (err, res2) => {
            let a = parseFloat(
              res2.ValCurs.Valute[2].Value[0].replace(',', '.')
            );
            // console.log(a);
            callback(a);
          });
        })
        .on('error', err => {
          console.log('Error: ', err);
        });
    }
  );
}

getRate(rate => console.log('From Outside', rate));
