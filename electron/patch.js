/*
   ./capacitor.config.json file not found issue

   https://github.com/ionic-team/capacitor/issues/1099
   https://github.com/ionic-team/capacitor/pull/1190/commits/e23ff4e1e690eb4191a9d5da873728249bfecc7d
 */

const fs = require('fs');
const f = 'node_modules/@capacitor/electron/index.js';

fs.readFile(f, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/let rootPath = process.cwd\(\);/g, 'let rootPath = global.__basedir;');

  fs.writeFile(f, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});
