module.exports = function gamecouk(req, res, next) {
  let postData = querystring.stringify({
    TechKeyword: '',
    SoftwareKeyword: `${req.params.id}`,
    button: 'Search',
    FirstName: '',
    LastName: '',
    MinimumBasketValue: 5
  });

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
        let platform = platformTranslate(
          $(el)
            .find('#platformImage')
            .attr('alt')
        );
        let title =
          $(el)
            .find('div.prod-title')
            .text() +
          ' ' +
          platform;
        let id = stringToHash.unique(title + platform);
        let price = $(el)
          .find('span.credit-price-field')
          .text();
        let priceForCash = $(el)
          .find('span.price-field')
          .text();
        let cover = $(el)
          .find('div.col-xs-6.col-md-4')
          .children()
          .first()
          .attr('src');
        result.push({
          id: id,
          title: titleNormalizer(title) + ' ' + id,
          price: rusPrice(price),
          priceForCash: rusPrice(priceForCash),
          cover:
            cover.search(
              /img\.game\.co\.uk\/assets\/img\/_tradein-img\/icon_grey\.jpg/
            ) === -1
              ? cover
              : // For local dev
            // : `${HOST}:${PORT}/images/no_photo.jpg`,
              'https://tinyscrap.herokuapp.com/images/no_photo.jpg',
          filters: [platform],
          language: 'undefined'
        });
      });
      res.status(200).send(result);
    });
  });

  request.on('error', error => {
    /* eslint-disable */
    console.error(`problem with request: ${error.message}`);
    /* eslint-enable */
  });

  request.write(postData);
  request.end();
};
