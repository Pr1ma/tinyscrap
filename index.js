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

const getGcuGames = require('./helpers/gameCoUk').getGcuGames;

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
              tags: [platform]
              // language: 'undefined'
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

// getRate(rate => {
//   return (exchangeRate = rate);
// });

// setInterval(function getRate(rate) {
//   return (exchangeRate = rate);
// }, 86400000);

// const removeCh = id => id.replace('ch_', '');

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/images', express.static(__dirname + '/images'));

app.use('/gcu/:id', (req, res) => {
  getGcuGames(req.params.id, data => {
    res.status(200).send(data);
  });
});

app.post('/check', async (req, res) => {
  const requestedGames = req.body.cart.map(el => ({
    title: el.title,
    id: el.id,
    price: el.price,
    priceForCash: el.priceForCash
  }));

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
