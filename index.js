const fetch = require('node-fetch');
const JSDOM = require('jsdom').JSDOM;
const express = require('express');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

const app = express();
// const router = express.Router();

const urlStart = 'https://market.yandex.ru/product/';
const urlEnd = '/offers?local-offers-first=1&how=aprice';
const priceSelector = 'div.price';
const titleSelector = 'span.snippet-card__header-text';

// app.use(yMMiddleware);
app.disable('x-powered-by');

app.get('/ym/:id', (req, res) => {
  res.send(req.params.id);
});

app.listen(PORT, HOST, () => console.log(`TinyScrap start at ${HOST}:${PORT}`));

// let selector = 'div.price';
// let url =
//   'https://market.yandex.ru/product/1727125340/offers?local-offers-first=1&how=aprice';

// fetch(url)
//   .then(resp => resp.text())
//   .then(text => {
//     let dom = new JSDOM(text);
//     let { document } = dom.window;
//     let list = [...document.querySelectorAll(selector)].map(a => a.textContent);
//     console.log(list);
//     // console.log(text);
//   });
