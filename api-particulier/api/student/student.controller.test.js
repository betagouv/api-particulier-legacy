const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const chai = require('chai')
chai.use(sinonChai)
chai.should()
const expect = chai.expect
const StudentController = require('./student.controller')
const axios = require('axios')
const MockAdapter = require('axios-mock-adapter')

const axiosMock = new MockAdapter(axios)

describe('Student Controller', () => {
  const supdataHost = 'la barbe de la famme à georges Moustaki'
  const supdataApiKey = 'georges moustaki'
  let studentController

  beforeEach(() => {
    studentController = new StudentController({
      supdataHost,
      supdataApiKey
    })
  })

  describe("when supdata doesn't return anything", () => {
    beforeEach(() => {
      axiosMock.onAny().networkError()
    })

    it('replies 500 on the ping route', done => {
      // given
      var req = {}
      var send = sinon.spy()
      var res = {
        status: sinon.stub().returns({
          send: send
        })
      }

      // when
      studentController.ping(req, res).then(() => {
        // then
        expect(send).to.have.been.calledWith('boom')
        done()
      })
    })
  })
})
