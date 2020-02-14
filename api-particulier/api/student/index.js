const express = require('express')
const authenticationMiddleware = require('../../auth/middleware')
const Controller = require('./student.controller')
const format = require('../lib/utils/format')
const scopeAuthorization = require('../lib/middlewares/scopeAuthorization')

module.exports = function (options) {
  const router = express.Router()
  const studentController = new Controller(options)

  router.get('/ping', studentController.ping, format)
  router.get(
    '/',
    authenticationMiddleware,
    studentController.student,
    studentController.authorize,
    scopeAuthorization,
    format
  )

  return router
}
