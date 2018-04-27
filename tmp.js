// function today(date) {
//   var day = date.getDate();
//   var month = date.getMonth() + 1;
//   var year = date.getFullYear();

//   return day + '/' + month + '/' + year;
// }

function tomorrow(date) {
  var day = date.getDate() + 1;
  var month = date.getMonth() + 1;
  var year = date.getFullYear();

  return day + '/' + month + '/' + year;
}

// console.log(today(new Date()));
// console.log(tomorrow(new Date()));

const fetch = require('node-fetch');

// console.log(
//   `http://www.cbr.ru/scripts/XML_daily.asp?date_req=${tomorrow(new Date())}`
// );

fetch(`http://www.cbr.ru/scripts/XML_daily.asp?date_req=${tomorrow}`)
  .then(response => response.json())
  .then(body => console.log(body))
  .catch(error => console.log(error));
