const caf = require('../caf')
const cafV2 = require('../caf-v2')
const impots = require('../impots')
const impotsV2 = require('../impots-v2')
const student = require('../student')
const system = require('../system')

exports.configure = function (app, options) {
  app.use('/api', system(options))

  app.use('/api/impots', impots(options))

  app.use('/api/caf', caf(options))

  app.use('/api/etudiant', student(options))

  app.use('/api/v2/avis-imposition', impotsV2(options))

  app.use('/api/v2/composition-familiale', cafV2(options))
}
