const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cheerio = require('cheerio');
const http = require('http');
const querystring = require('querystring');
const https = require('https');
const parseString = require('xml2js').parseString;
const iconv = require('iconv-lite');
const stringToHash = require('./stringToHash');
const helpers = require('./helpers');
// const fs = require('fs');
const bodyParser = require('body-parser');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

// let form = new FormData();

//сделать trim + tolowercase + переименовать
//сделать массив платформ
function getVideoigrPlatform(input) {
  const platforms = /(PS3)|(Nintendo Wii U)|(Nintendo 3DS)|(PS Vita)|(Xbox One)|(PS4)|(Nintendo Switch)/;
  const result = platforms.exec(input);
  if (result === null) return;
  return result[0];
}

let exchangeRate;

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

// const removeCh = id => id.replace('ch_', '');

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/images', express.static(__dirname + '/images'));

app.post('/check', (req, res) => {
  let finalResult;
  //Обработка запроса - start

  //Обработка запроса - end

  //Готовим ответ
  res.setHeader('Content-Type', 'application/json');
  res.send(
    JSON.stringify({
      ok: true,
      message: ['Ok'],
      cart: [
        {
          id: 123454,
          price: 100,
          priceForCash: 50
        }
      ]
    })
  );
});

app.get('/vi', (req, res) => {
  https.get('https://videoigr.net/msc_trade_in.php', response => {
    let data = '';

    response.on('data', chunk => {
      data += iconv.decode(chunk, 'win1251');
    });

    response
      .on('end', () => {
        const $ = cheerio.load(data.toString('utf8'));
        let result = [];

        $('#table1 tr:nth-child(2) td:nth-child(2) table:nth-child(2) tr').each(
          (i, el) => {
            let id = $(el)
              .find('input')
              .attr('id');
            let title = $(el)
              .find('td')
              .eq(1)
              .text();
            let price = $(el)
              .find('input')
              .attr('price2');
            let priceForCash = $(el)
              .find('input')
              .attr('price1');
            // let platform = getVideoigrPlatform(title);
            let platform = title;
            result.push({
              id: id,
              title: title,
              price: price,
              priceForCash: priceForCash,
              cover: 'undefined',
              filters: [platform],
              language: 'undefined'
            });
          }
        );

        res.json(result);
      })
      .on('error', err => {
        throw err;
      });
  });
});

//Game.co.uk
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
        let platform = helpers.platformTranslate(
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
        let id = stringToHash.unique(title + platform);
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
          id: id,
          title: helpers.gcuTitleNormalizer(title) + ' ' + id,
          price: helpers.fromGbpToRubPrice(price, exchangeRate),
          priceForCash: helpers.fromGbpToRubPrice(priceForCash, exchangeRate),
          cover:
            cover.search(
              /img\.game\.co\.uk\/assets\/img\/_tradein-img\/icon_grey\.jpg/
            ) === -1
              ? cover
              : 'https://tinyscrap.herokuapp.com/images/no_photo.jpg',
          filters: [platform],
          language: 'undefined'
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

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('*', (req, res) => {
  res.status(403).end();
});
/* eslint-disable-next-line no-console */
app.listen(PORT, HOST, console.log('App was started'));
