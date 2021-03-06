const querystring = require('querystring');
const stringToHash = require('../src/stringToHash');
const cheerio = require('cheerio');
const https = require('https');
const helpers = require('../src/helpers');
const exchangeRate = require('./exchangeRate');
const gamecoukIdBlacklist = require('../gameblacklist/gamecoukIdBlacklist');

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
  // console.log('Incoming name: ', name);
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
        let price = helpers.fromGbpToRubPrice(
          $(el)
            .find('span.credit-price-field')
            .text(),
          exchangeRate.value
        );
        let priceForCash = helpers.fromGbpToRubPrice(
          $(el)
            .find('span.price-field')
            .text(),
          exchangeRate.value
        );
        let cover = $(el)
          .find('div.col-xs-6.col-md-4')
          .children()
          .first()
          .attr('src');

        result.push({
          id: id,
          title: helpers.gcuTitleNormalizer(title) + ' ' + platform,
          price: price === 0 ? 20 : price,
          priceForCash: priceForCash === 0 ? 20 : priceForCash,
          cover:
            cover.search(
              /img\.game\.co\.uk\/assets\/img\/_tradein-img\/icon_grey\.jpg/
            ) === -1
              ? cover
              : `https://tinyscrap.gamebuy.ru/images/${helpers.removeBrackets(
                platform
              )}.svg`,
          tags: [helpers.removeBrackets(platform)],
          language: undefined
        });
      });
      const filtered = helpers.removeArrayDoublicates(result, 'id');
      const filteredByBlacklist = filtered.filter(
        el => !gamecoukIdBlacklist.includes(el.id)
      );
      callback(filteredByBlacklist);
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

module.exports = {
  getGcuGames
};
