const {expect} = require('chai')
const sinonChai = require('sinon-chai')
const chai = require('chai')
chai.use(sinonChai)
chai.should()
const fakeData = require('../data/ants-fake-response.json')

describe('The ANTS fake data', () => {
  it('should have the correct structure', () => {
    fakeData.forEach(datum => {
      expect(datum).to.have.property('numeroAllocataire')
      expect(datum).to.have.property('codePostal')
      expect(datum).to.have.property('response')

      const response = datum.response

      expect(response).to.have.property('allocataires')
      response.allocataires.forEach(allocataire => {
        expect(allocataire).to.have.property('nomPrenom')
        expect(allocataire).to.have.property('dateDeNaissance')
        expect(allocataire).to.have.property('sexe')
      })

      expect(response).to.have.property('enfants')
      response.enfants.forEach(enfant => {
        expect(enfant).to.have.property('nomPrenom')
        expect(enfant).to.have.property('dateDeNaissance')
        expect(enfant).to.have.property('sexe')
      })

      expect(response).to.have.property('adresse')

      const adresse = response.adresse

      expect(adresse).to.have.property('identite')
      expect(adresse).to.have.property('complementIdentiteGeo')
      expect(adresse).to.have.property('numeroRue')
      expect(adresse).to.have.property('codePostalVille')
      expect(adresse).to.have.property('pays')

      expect(response).to.have.property('quotientFamilial')
      expect(response.quotientFamilial).to.be.a('string')
      expect(response).to.have.property('mois')
      expect(response.mois).to.be.a('string')
      expect(response).to.have.property('annee')
      expect(response.annee).to.be.a('string')
    })
  })
})
