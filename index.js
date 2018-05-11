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

let exchangeRate;

// const gamebuyPlatformsPattern = /(X360)|(Xbox One)|(Wii U)|(Wii)|(NSwitch)|(3DS)|(NDS)|(PS3)|(PS4)/;

function getGcuGames(name, callback) {
  let postData = querystring.stringify({
    TechKeyword: '',
    SoftwareKeyword: name,
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
        let platform = helpers.gcuPlatformTranslate(
          $(el)
            .find('#platformImage')
            .attr('alt')
        );
        let title =
          $(el)
            .find('div.prod-title')
            .text() + platform;
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
          title: helpers.gcuTitleNormalizer(title),
          price: helpers.fromGbpToRubPrice(price, exchangeRate),
          priceForCash: helpers.fromGbpToRubPrice(priceForCash, exchangeRate),
          cover:
            cover.search(
              /img\.game\.co\.uk\/assets\/img\/_tradein-img\/icon_grey\.jpg/
            ) === -1
              ? cover
              : 'https://tinyscrap.herokuapp.com/images/no_photo.jpg',
          tags: [platform],
          language: 'undefined'
        });
      });
      callback(result);
    });
  });

  request.on('error', error => {
    /* eslint-disable */
    console.error(`problem with request: ${error.message}`);
    /* eslint-enable */
  });

  request.write(postData);
  request.end();
}

function getVideoigrPreownedGamesPrices(req, res) {
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
            let platform = helpers.getVideoigrPlatform(title);
            // let platform = title;
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
}

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
  let requestedGames = req.body.cartInitial.map(el => el.title);
  let result = [];

  for (let i = 0; i < requestedGames.length; i++) {
    getGcuGames(requestedGames[i], data => {
      if (data.length === 0)
        result.push({ message: 'Не смогли оценить позицию' });
      result.push(data[0]);
    });
  }

  res.status(200).send(result);
});

app.get('/vi', getVideoigrPreownedGamesPrices);

//Game.co.uk
app.use('/gcu/:id', (req, res) => {
  getGcuGames(req.params.id, data => {
    res.status(200).send(data);
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('*', (req, res) => {
  res.status(403).end();
});
/* eslint-disable-next-line no-console */
app.listen(PORT, HOST, console.log('App was started'));
