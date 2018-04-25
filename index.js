const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const URL = 'https://gamebuy.ru';
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 8080;

const ymStart = 'https://market.yandex.ru/product/';
const ymEnd = '/offers?local-offers-first=1&how=aprice';

const screenshot = 'amazon_nyan_cat_pullover.png';

const app = express();

app.disable('x-powered-by');

app.get('/test', (req, res) => {
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(ymStart + '1886948783' + ymEnd);

    const goods = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('.price'));
      const titles = Object.from(
        document.querySelectorAll('.n-snippet-card2__header')
      );

      return titles.map(el => el.textContent).slice(0);
      //return anchors.map(el => el.textContent).slice(0)
    });

    console.log(goods);
    await browser.close();
    // res.send(goods);
  })();
});

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

app.get('/gcu/:id', (req, res) => {
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
      await page.type('#SoftwareKeyword', req.params.id);
      await page.click('#SoftwareSearch.btn.btn-primary.btn-lg');
      await page.waitForSelector('.cushion');

      const data = await page.$$eval('div.row.cushion', divs => divs.length);

      // const data = await page.evaluate(() => {
      //   const itemCards = Array.from(document.querySelectorAll('.row.cushion'));
      //     const item = itemCards.map(el => {
      //       const platform = el.
      //     })
      //   return itemCards;
      // });
      await page.screenshot({ path: 'gcu.png' });
      await browser.close();
      console.log('DONE', data);
    })();
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, HOST, () => console.log(`TinyScrap start at ${HOST}:${PORT}`));
