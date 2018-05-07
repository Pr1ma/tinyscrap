const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const FormData = require('form-data');
// const fetch = require('node-fetch');
const cheerio = require('cheerio');
const http = require('http');
const querystring = require('querystring');
const https = require('https');
const parseString = require('xml2js').parseString;

const stringToHash = require('./stringToHash');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

// let form = new FormData();

let tomorrow = date => {
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

let exchangeRate;

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
            let rate = parseFloat(
              res2.ValCurs.Valute[2].Value[0].replace(',', '.')
            );
            callback(rate);
          });
        })
        .on('error', err => {
          throw err;
        });
    }
  );
}

getRate(rate => {
  return (exchangeRate = rate);
});

setInterval(function getRate(rate) {
  return (exchangeRate = rate);
}, 86400000);

const rusPrice = price => {
  const result = Math.round(price.replace('£', '') * exchangeRate / 50) * 50;
  return result;
};

//Вероятно search() здесь избыточен
const titleNormalizer = title =>
  title.search(/ - Only at GAME/) !== -1
    ? title.replace(' - Only at GAME', '')
    : title;

const app = express();

app.use(helmet());
app.use(cors());
app.use('/images', express.static(__dirname + '/images'));

app.get('/gcu/:id', (req, res) => {
  let postData = querystring.stringify({
    TechKeyword: '',
    SoftwareKeyword: `${req.params.id}`,
    button: 'Search',
    FirstName: '',
    LastName: '',
    MinimumBasketValue: 5
  });

  let options = {
    hostname: 'tradein.game.co.uk',
    port: 443,
    path: '/?cm_sp=TradeInOnline-_-Portal-_-CheckPrices',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  const request = https.request(options, response => {
    let data;

    response.on('data', d => {
      data += d;
    });

    response.on('end', () => {
      let result = [];
      const $ = cheerio.load(data.toString());

      $('div.row.row-border').each((i, el) => {
        let platform = platformTranslate(
          $(el)
            .find('#platformImage')
            .attr('alt')
        );
        let title =
          $(el)
            .find('div.prod-title')
            .text() +
          ' ' +
          platform;
        let price = $(el)
          .find('span.credit-price-field')
          .text();
        let priceForCash = $(el)
          .find('span.price-field')
          .text();
        let cover = $(el)
          .find('div.col-xs-6.col-md-4')
          .children()
          .first()
          .attr('src');
        result.push({
          id: stringToHash.unique(title),
          title: titleNormalizer(title),
          price: rusPrice(price),
          priceForCash: rusPrice(priceForCash),
          cover:
            cover.search(
              /img\.game\.co\.uk\/assets\/img\/_tradein-img\/icon_grey\.jpg/
            ) === -1
              ? cover
              : // For local dev
            // : `${HOST}:${PORT}/images/no_photo.jpg`,
              'https://tinyscrap.herokuapp.com/images/no_photo.jpg',
          filters: {
            platform: platform
          }
        });
      });
      res.status(200).send(result);
    });
  });

  request.on('error', error => {
    /* eslint-disable */
    console.error(`problem with request: ${error.message}`);
    /* eslint-enable */
  });

  request.write(postData);
  request.end();
});

app.get('/images/:name', (req, res, next) => {
  let options = {
    root: __dirname + '/images/',
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  };

  let fileName = req.params.name;
  res.sendFile(fileName, options, err => {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('*', (req, res) => {
  res.status(403).end();
});
/* eslint-disable-next-line no-console */
app.listen(PORT, HOST, console.log('App was started'));
