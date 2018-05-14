const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cheerio = require('cheerio');
const https = require('https');
const iconv = require('iconv-lite');
const helpers = require('./helpers');
// const fs = require('fs');
const bodyParser = require('body-parser');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

<<<<<<< HEAD
let exchangeRate;

const getGcuGames2 = function(name, callback) {
  let postData = querystring.stringify({
    TechKeyword: '',
    SoftwareKeyword: name,
    button: 'Search',
    FirstName: '',
    LastName: '',
    MinimumBasketValue: 5
  });
  /* eslint-disable-next-line no-console */
  console.log('Incoming name: ', name);
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
  return new Promise((resolve, reject) => {
    const request = https.request(options, response => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(
          new Error('Failed to load data, status code' + response.statusCode)
        );
      }

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
          let title = $(el)
            .find('div.prod-title')
            .text();
          let id = stringToHash.unique(title + ' ' + platform);
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
            title: helpers.gcuTitleNormalizer(title) + ' ' + platform,
            price: helpers.fromGbpToRubPrice(price, exchangeRate),
            priceForCash: helpers.fromGbpToRubPrice(priceForCash, exchangeRate),
            cover:
              cover.search(
                /img\.game\.co\.uk\/assets\/img\/_tradein-img\/icon_grey\.jpg/
              ) === -1
                ? cover
                : 'https://tinyscrap.herokuapp.com/images/no_photo.svg',
            tags: [platform]
            // language: 'undefined'
          });
        });
        /* eslint-disable-next-line no-console */
        console.log('HTTP.request result: ', result);
        resolve(callback(result));
      });
    });

    request.on('error', error => {
      /* eslint-disable */
      reject(error);
      // console.error(`problem with request: ${error.message}`);
      /* eslint-enable */
    });

    request.write(postData);
    request.end();
  });
};

function getGcuGames(name, callback) {
  let postData = querystring.stringify({
    TechKeyword: '',
    SoftwareKeyword: name,
    button: 'Search',
    FirstName: '',
    LastName: '',
    MinimumBasketValue: 5
  });
  /* eslint-disable-next-line no-console */
  console.log('Incoming name: ', name);
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
        let title = $(el)
          .find('div.prod-title')
          .text();
        let id = stringToHash.unique(title + ' ' + platform);
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
          title: helpers.gcuTitleNormalizer(title) + ' ' + platform,
          price: helpers.fromGbpToRubPrice(price, exchangeRate),
          priceForCash: helpers.fromGbpToRubPrice(priceForCash, exchangeRate),
          cover:
            cover.search(
              /img\.game\.co\.uk\/assets\/img\/_tradein-img\/icon_grey\.jpg/
            ) === -1
              ? cover
              : 'https://tinyscrap.herokuapp.com/images/no_photo.svg',
          tags: [platform]
          // language: 'undefined'
        });
      });
      /* eslint-disable-next-line no-console */
      console.log('HTTP.request result: ', result);
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
=======
const getGcuGames = require('./helpers/gameCoUk').getGcuGames;
>>>>>>> master

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
            result.push({
              id: id,
              title: title,
              price: price,
              priceForCash: priceForCash,
              cover: 'undefined',
              tags: [platform],
              language: helpers.getVideoigrLaguage(title)
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

<<<<<<< HEAD
function getExchangeRate(callback) {
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

getExchangeRate(rate => {
  return (exchangeRate = rate);
});

setInterval(function getExchangeRate(rate) {
  return (exchangeRate = rate);
}, 86400000);
=======
// getRate(rate => {
//   return (exchangeRate = rate);
// });

// setInterval(function getRate(rate) {
//   return (exchangeRate = rate);
// }, 86400000);
>>>>>>> master

// const removeCh = id => id.replace('ch_', '');

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/images', express.static(__dirname + '/images'));

app.use('/gcu/:id', (req, res) => {
  getGcuGames2(req.params.id, data => {
    res.status(200).send(data);
  });
});

<<<<<<< HEAD
app.post('/check', (req, res) => {
  let result = [];

  const requestedGames = req.body.cartInitial.map(el => ({
=======
app.post('/check', async (req, res) => {
  const requestedGames = req.body.cart.map(el => ({
>>>>>>> master
    title: el.title,
    id: el.id,
    price: el.price,
    priceForCash: el.priceForCash
  }));

<<<<<<< HEAD
  let toSearch = [];

  function un(arr) {
    let obj = {};
    for (let i = 0; i < arr.length; i++) {
      let str = helpers.removeGbPlatform(arr[i].title);
      obj[str] = true;
    }
    return (toSearch = Object.keys(obj));
  }
  un(requestedGames);

  (() => {
    for (let i = 0; i < toSearch.length; i++) {
      getGcuGames2(toSearch[i], data => {
        if (data.length === 0) result.push({ message: 'Длинна ответа = 0' });

        //Сверяем id

        result.push(data);
        console.log('INNER FINAL: ', result);
      });
    }
  })();

  //Надо решить проблему с асинхронностью
  console.log('FINAL: ', result);
  res.status(200).send(result);
=======
  let idsToSearch = req.body.cart.map(el => el.id);

  let titlesToSearch = [];

  let filter = new RegExp(idsToSearch.join('|'), 'g');

  function makeUniqueRequests(arr) {
    let obj = {};
    for (let i = 0; i < arr.length; i++) {
      let str = helpers
        .removeGbPlatform(arr[i].title)
        .toLowerCase()
        .replace(
          new RegExp(
            `(${[
              '\\.',
              '&',
              'the',
              '’',
              // '\\\'s',
              '\\\'',
              ':',
              '\\"',
              'special',
              'edition',
              'limited',
              'collectors',
              'anniversary',
              'complete',
              'deluxe',
              'game of the year edition',
              'game',
              'only',
              '(Classics)',
              '(Nintendo Selects)'
            ].join(')|(')})`,
            'gi'
          ),
          ''
        )
        .trim()
        .split(' ', 2)
        .join(' ');
      obj[str] = true;
    }
    return (titlesToSearch = Object.keys(obj));
  }
  makeUniqueRequests(requestedGames);

  const gameRequest = titlesToSearch.map(
    el =>
      new Promise(resolve => {
        setTimeout(() => {
          getGcuGames(el, data => {
            const result1 = data.filter(found => found.id.match(filter)) || {
              ok: false,
              message: 'что-то пошло не так'
            };
            resolve(result1);
          });
        }, Math.random() * 1000);
      })
  );

  const resultProducts = await Promise.all(gameRequest);

  const oneDimension = [].concat(...resultProducts);

  const final = helpers.removeArrayDoublicates(oneDimension, 'id');

  res.status(200).send(final);
>>>>>>> master
});

app.get('/gettags', (req, res) => {
  res.status(200).send('Until today we have nothing');
});

app.get('/vi', getVideoigrPreownedGamesPrices);

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('*', (req, res) => {
  res.status(403).end();
});
/* eslint-disable-next-line no-console */
app.listen(PORT, HOST, console.log('App was started'));
