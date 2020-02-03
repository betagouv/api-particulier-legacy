
const express = require('express');
const morgan = require('morgan')
const app = express();
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path')
const Import = require('./data')
const http = require('http')
const throng = require('throng')

app.engine('.hbs', exphbs({defaultLayout: 'single', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(morgan('combined'))
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static('public'))

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/secavis/faces/commun/index.jsf', function (req, res) {
  const numFiscal = req.body["j_id_7:spi"]
  const referenceAvis = req.body["j_id_7:num_facture"]
  const id = numFiscal + "+" + referenceAvis
  const defaultData = {
    anneeImpots: '2015',
    anneeRevenus: '2014'
  }
  let dataImport = new Import(__dirname + '/data');
  return dataImport.data().then((data) => {
    let result = data[id]
      if(result) {
        result.layout = false;
        res.render('svair', Object.assign(defaultData, result));
      } else {
        res.render('missing', { layout: false });
      }
    })
});

app.use('/secavis', express.static(path.join(__dirname, 'public')));


const PORT = process.env.PORT || 3000
let server

throng({workers: 4}, function () {
  server = http.createServer(app)
  server.listen(PORT, function (err) {
    console.log('SVAIR app listening on port %s!', PORT);
  })
})
