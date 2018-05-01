const express = require('express');
const puppeteer = require('puppeteer');
const helmet = require('helmet');
const http = require('http');
const parseString = require('xml2js').parseString;

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

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

getRate(rate => (exchangeRate = rate));

setInterval(function getRate(rate) {
  return (exchangeRate = rate);
}, 86400000);

/*
const ymStart = 'https://market.yandex.ru/product/';
const ymEnd = '/offers?local-offers-first=1&how=aprice';
*/
const app = express();

app.use(helmet());

// app.disable('x-powered-by');

//Работаем с yandex.market
/*
app.get('/ym/:id', (req, res) => {
  res.send(req.params.id);
});
*/

//Работаем с amazon.co.uk
/*
app.get('/amazon/:id', (req, res) => {
  try {
    (async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto('https://www.amazon.co.uk');
      await page.type('#twotabsearchtextbox', req.params.id);
      await page.click('input.nav-input');
      await page.waitForSelector('#resultsCol');
      // await page.screenshot({ path: 'search_in_list.png' });
      // const firstProductName = await page.$('a.a-link-normal.a-text-normal');

      const cardData = await page
        .evaluate(() => {
          const card = document.querySelector('#result_0');
          const title = card.querySelector('h2.a-text-normal').innerText;
          const platforms = Array.from(
            card.querySelectorAll('.a-size-small.s-inline.a-text-normal')
          );
          const allPlatforms = platforms.map(el => el.textContent);
          const prices = Array.from(card.querySelectorAll('.a-color-price'));
          const allPrices = prices.map(el => el.textContent);

          return { title: title, platform: allPlatforms, price: allPrices };
        })
        .catch(error => console.log('TryCatch Error', error));

      console.log('Result is: ', cardData);
      await browser.close();
    })();
  } catch (err) {
    console.error(err);
  }
});
*/

//Работаем с games.co.uk
app.get('/gcu/:id', async (req, res) => {
  try {
    (async () => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(
        'https://tradein.game.co.uk/?cm_sp=TradeInOnline-_-Portal-_-CheckPrices'
      );
      await page.waitForSelector('#searchTab');
      await page.click('a[href="#searchSoftware"]');
      await page.type('#SoftwareKeyword', req.params.id, {
        delay: Math.floor(Math.random() * 100) + 50
      });

      //(node:26098) UnhandledPromiseRejectionWarning: Error: Protocol error (Runtime.callFunctionOn): Cannot find context with specified id undefined
      // await page.keyboard.press('Enter', { delay: 50 });

      await page.click('#SoftwareSearch.btn.btn-primary.btn-lg');
      await page.waitForSelector('.cushion');
      // await page.screenshot({ path: 'gcu_before.png' });

      await page.addScriptTag({
        content: `function platformToString(input) {
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
      };
      `
      });
      await page.addScriptTag({ content: `let exchangeRate=${exchangeRate}` });

      const responseToReq = await page.evaluate(() => {
        let result = [];
        /* eslint-disable */
        document.querySelectorAll('div.row.row-border').forEach(el => {
          /* eslint-enable */
          if (el.hasChildNodes()) {
            const title = el.querySelector('div.prod-title').textContent;
            const credit = el.querySelector('span.credit-price-field')
              .textContent;
            const cash = el.querySelector('span.price-field').textContent;
            const platform = el
              .querySelector('#platformImage')
              .getAttribute('alt');
            const image = el
              .querySelector('div.col-xs-6.col-md-4')
              .firstElementChild.getAttribute('src');
            const id = 'unknown';
            result.push({
              id: id || 'unknown',
              /* eslint-disable */
              title: title + ' ' + platformToString(platform) || 'unknown',
              /* eslint-enable */
              price:
                Math.round(credit.replace('£', '') * exchangeRate / 50) * 50 ||
                'unknown',
              priceForCash:
                Math.round(cash.replace('£', '') * exchangeRate / 50) * 50 ||
                'unknown',
              cover: image || 'unknown'
            });
          }
        });

        return result;
      });
      await browser.close();
      res.status(200).json(responseToReq);
    })();
  } catch (err) {
    throw err;
  }
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('*', (req, res) => {
  res.status(403).end();
});

app.listen(PORT, HOST);
