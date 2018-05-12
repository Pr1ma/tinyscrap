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
            // let platform = title;
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
  const requestedGames = req.body.cart.map(
    el =>
      new Promise((resolve, reject) => {
        const title = helpers.removeGbPlatform(el.title);
        const id = el.id;

        setTimeout(() => {
          getGcuGames(title, data => {
            const result = data.filter(p => p.id === id)[0] || {
              id,
              price: null,
              priceForCash: null,
              title
            };
            resolve(result);
          });
        }, Math.random() * 1000);
      })
  );

  const resultProducts = await Promise.all(requestedGames);

  // let result = [];

  // (() => {
  //   for (let i = 0; i < requestedGames.length; i++) {
  //     getGcuGames(requestedGames[i].title, data => {
  //       //Какая-то проверка
  //       if (data.length === 0)
  //         result.push({ message: 'Не смогли оценить позицию' });
  //       // console.log(data[0].price);
  //       //проверка на соответствие цен
  //       // if (
  //       //   requestedGames.price === data[0].price &&
  //       //   requestedGames.priceForCash === data[0].priceForCash
  //       // )
  //       // console.log('Цены РАВНЫ');

  //       result.push(data[0]);
  //     });
  //   }
  // })();
  // console.log('FINAL: ', result);
  res.status(200).send(resultProducts);
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
