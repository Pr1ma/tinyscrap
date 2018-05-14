const cheerio = require('cheerio');
const https = require('https');
const helpers = require('../src/helpers');
const iconv = require('iconv-lite');

function getVideoigrUsed(req, res) {
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

module.exports = {
  getVideoigrUsed
};