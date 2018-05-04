const express = require('express');
// const cors = require('cors');
const helmet = require('helmet');
const FormData = require('form-data');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const http = require('http');
// const https = require('https');
const parseString = require('xml2js').parseString;

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

let form = new FormData();

let tomorrow = date => {
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
            // console.log(a);
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
  // if (price typeof !== 'string')
  const result = Math.round(price.replace('£', '') * exchangeRate / 50) * 50;
  return result;
};

const app = express();

app.use(helmet());
// app.use(cors());

app.get('/gcu/:id', (req, res) => {
  form.append('TechKeyword', '');
  form.append('SoftwareKeyword', `${req.params.id}`);
  form.append('button', 'Search');
  form.append('FirstName', '');
  form.append('LastName', '');
  form.append('MinimumBasketValue', 5);

  (async function() {
    const response = await fetch(
      'https://tradein.game.co.uk/?cm_sp=TradeInOnline-_-Portal-_-CheckPrices',
      {
        method: 'POST',
        body: form
      }
    );
    const data = await response.text();
    const $ = await cheerio.load(data);
    const result = [];

    $('div.row.row-border').each((i, el) => {
      result.push({
        id: 'unknown',
        title:
          $(el)
            .find('div.prod-title')
            .text() +
          ' ' +
          platformTranslate(
            $(el)
              .find('#platformImage')
              .attr('alt')
          ),
        price: rusPrice(
          $(el)
            .find('span.credit-price-field')
            .text()
        ),
        priceForCash: rusPrice(
          $(el)
            .find('span.price-field')
            .text()
        ),
        cover: $(el)
          .find('div.col-xs-6.col-md-4')
          .children()
          .first()
          .attr('src')
      });
    });
    res.status(200).json(result);
  })();
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('*', (req, res) => {
  res.status(403).end();
});

app.listen(PORT, HOST);
