const app = require('./app');
const http = require('http')
const throng = require('throng')

const PORT = process.env.PORT || 3000
let server

throng({workers: 4}, function () {
  server = http.createServer(app)
  server.listen(PORT, function (err) {
    console.log('SVAIR app listening on port %s!', PORT);
  })
})
