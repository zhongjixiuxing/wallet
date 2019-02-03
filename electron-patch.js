/*
   patch for electron ERR_FILE_NOT_FOUND issue


   reference:  https://github.com/electron/electron/issues/1769
 */

const fs = require('fs');
const f = 'electron/app/index.html';

fs.readFile(f, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/<base href="\/" \/>/g, '<base href="./" />');

  fs.writeFile(f, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});