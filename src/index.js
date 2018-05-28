const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const helpers = require('./helpers');
const bodyParser = require('body-parser');
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

const getGcuGames = require('../helpers/gameCoUk').getGcuGames;
const getVideoigrUsed = require('../helpers/videoigr').getVideoigrUsed;

const app = express();

app.use(helmet());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/images', express.static(__dirname + './../images'));

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
  //Разбираем пришедший запрос по элементам
  let idsToSearch = req.body.cart.map(el => el.id);

  //Сюда попадут только уникальные тайтлы для фетча
  let titlesToSearch = [];

  //Создаём регэксп по которому будем фильтровать тайтлы
  let filter = new RegExp(idsToSearch.join('|'), 'g');

  //Функция добавляет в массив только уникальные тайтлы
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
              // '\\\'',
              ':',
              '\\"',
              'special',
              'edition',
              'limited',
              'selects',
              'collectors',
              'anniversary',
              'extended',
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

  //Промис-запрос на game.co.uk
  const gameRequest = titlesToSearch.map(
    el =>
      new Promise(resolve => {
        setTimeout(() => {
          getGcuGames(el, data => {
            //здесь я забыл что происходит =)
            // console.log(el, filter);
            const result1 = data.filter(found => found.id.match(filter));
            resolve(result1);
          });
        }, Math.random() * 1000);
      })
  );

  //резолвим промисы
  const resultProducts = await Promise.all(gameRequest);

  //преобразуем данные в одномерный массив
  const oneDimension = [].concat(...resultProducts);

  //удаляем из результатов дубликаты (наверное можно будет убрать, надо снова потестить)
  const final = helpers.removeArrayDoublicates(oneDimension, 'id');

  res.status(200).send(final);
});

app.get('/gettags', (req, res) => {
  res.status(200).send('Until today we have nothing');
});

app.get('/vi', getVideoigrUsed);

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('*', (req, res) => {
  res.status(403).end();
});
/* eslint-disable-next-line no-console */
app.listen(PORT, HOST, console.log('App was started'));
