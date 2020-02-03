const fs = require('then-fs');
const thenify = require('thenify');
const parse = thenify(require('csv-parse'));

module.exports = class Import {
  constructor(dir) {
    const files = fs.readdirSync(dir);
    this.files = files.filter((file) => {
      return file.endsWith('.csv')
    }).map((file)=> { return dir + '/' + file});
  }

  data() {
    return this.filesPromise().then((csvs) => {
      return Promise.all(this.csvPromises(csvs)).then((infos) => {
        return infos.reduce((acc, info) => {
          return Object.assign(acc, info)
        }, {})
      })
    })
  }

  filesPromise () {
    let filePromises = this.files.map((file) => {
      return fs.readFile(file, 'utf8')
    })
    return Promise.all(filePromises)
  }

  csvPromises(csvs) {
    return csvs.map((csv) => {
      return parse(csv, {delimiter: ',', columns: true}).then(this.generateJson)
    })
  }

  generateJson(data) {
    let res = {}
    data[0].forEach((row) => {
      let id = row.id;
      res[id] = {};
      delete row.id;
      for (let attr in row) {
        deepSet(res[id], attr, row[attr])
      }
    });
    return res;

    function deepSet(object, attr, value) {
      let deepAttrs = attr.split('.');
      deepAttrs.reduce((acc, deepAttr, i) => {
        if (i < deepAttrs.length - 1) {
          acc[deepAttr] = object[deepAttr] || {};
          return acc[deepAttr]
        } else {
          acc[deepAttr] = value
        }
      }, object)
    }
  }
}
