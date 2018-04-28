const express = require('express');
const puppeteer = require('puppeteer');
const helmet = require('helmet');
// const platformTranslate = require('./platformTranslate.js');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

const ymStart = 'https://market.yandex.ru/product/';
const ymEnd = '/offers?local-offers-first=1&how=aprice';

const app = express();

app.use(helmet());

// app.disable('x-powered-by');

//Работаем с yandex.market
app.get('/ym/:id', (req, res) => {
  res.send(req.params.id);
});

//Работаем с amazon.co.uk
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

      await page.addScriptTag({ path: './platformTranslate.js' });

      const responseToReq = await page.evaluate(() => {
        let result = [];

        const hz = document
          .querySelectorAll('div.row.row-border')
          .forEach(el => {
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
                title: title + ' ' + platformTranslate(platform) || 'unknown',
                price: credit || 'unknown',
                priceForCash: cash || 'unknown',
                cover: image || 'unknown'
              });
            }
          });

        return result;
      });
      await browser.close();
      res.json(responseToReq);
      console.log(
        'DONE ------------------>\n',
        responseToReq,
        `\n------------------>typeof: ${typeof responseToReq}`
      );
    })();
  } catch (err) {
    console.log(err);
  }
});

app.get('/favicon.ico', (req, res) => res.status(204));

app.use('*', (req, res) => {
  res.status(403);
  res.send('NOTHING THERE TO WATCH');
});

app.listen(PORT, HOST, () => console.log(`TinyScrap start at ${HOST}:${PORT}`));
