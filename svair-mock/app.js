const axios = require('axios');
const express = require('express');
const morgan = require('morgan')
const app = express();
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path')
const numeral = require('numeral')

numeral.register('locale', 'fr', {
    delimiters: {
        thousands: ' ',
    },
    currency: {
        symbol: '€'
    }
});
numeral.locale('fr');

const formatMoney = amount => amount !== null ? numeral(amount).format('0,0 $') : null;

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
  let notice, person1, person2, address;

  return axios.get(`https://raw.githubusercontent.com/betagouv/svair-mock-data/master/data/notices/${numFiscal}_${referenceAvis}.json`)
    .then(({data}) => {
      notice = data;
      return axios.get(`https://raw.githubusercontent.com/betagouv/svair-mock-data/master/data/people/${notice.person1}.json`);
    })
    .then(({data}) => {
      person1 = data;
      if (notice.person2) {
        return axios.get(`https://raw.githubusercontent.com/betagouv/svair-mock-data/master/data/people/${notice.person2}.json`);
      }
      return {data: {}};
    })
    .then(({data}) => {
      person2 = data;
      return axios.get(`https://raw.githubusercontent.com/betagouv/svair-mock-data/master/data/addresses/${notice.address}.json`);
    })
    .then(({data}) => {
      address = data;
      const formattedData = {
        ...notice,
        person1,
        person2,
        address,
        layout: false,
        taxBeforeCorrection: notice.taxBeforeCorrection.taxable ? formatMoney(notice.taxBeforeCorrection.amount) : 'Non imposable',
        tax: notice.tax.taxable ? formatMoney(notice.tax.amount) : 'Non imposable',
        globalEarnings: formatMoney(notice.globalEarnings),
        taxableEarnings: formatMoney(notice.taxableEarnings),
        referenceEarnings: formatMoney(notice.referenceEarnings)
      }
      res.render('svair', formattedData);
    })
    .catch(error => {
      console.log(error)
      res.render('missing', { layout: false });
    });
});

app.use('/secavis', express.static(path.join(__dirname, 'public')));

module.exports = app;