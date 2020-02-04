const Import = require('./data')
const dataImport = new Import(__dirname + '/data');
const _ = require('lodash')
const uuidv4 = require('uuid/v4');
const fs = require('fs');

const getMoneyAmount = rawAmount => parseInt(rawAmount.replace(' ', '').replace('€', ''));

dataImport.data().then((rows) => {
    const identities = [];
    const addresses = [];
    const notices = _.map(rows, (row, id) => {
        const notice = {};

        // Person1
        let person1 = _.find(identities, {
            surname: row.declarant1.nomNaissance,
            name: row.declarant1.prenoms,
            birthdate: row.declarant1.dob
        });
        if (!person1) {
            person1 = {
                id: uuidv4(),
                surname: row.declarant1.nomNaissance,
                name: row.declarant1.prenoms,
                birthname: row.declarant1.nomNaissance,
                birthdate: row.declarant1.dob
            }
            identities.push(person1);
        }
        notice.person1 = person1.id;

        // Person2
        if (row.declarant2.nomNaissance !== '') {
            let person2 = _.find(identities, {
                surname: row.declarant2.nomNaissance,
                name: row.declarant2.prenoms,
                birthdate: row.declarant2.dob
            });
            if (!person2) {
                person2 = {
                    id: uuidv4(),
                    surname: row.declarant2.nomNaissance,
                    name: row.declarant2.prenoms,
                    birthname: row.declarant2.nomNaissance,
                    birthdate: row.declarant2.dob
                }
                identities.push(person2);
            }
            notice.person2 = person2.id;
        }

        // Address
        let address = _.find(addresses, {
            line1: row.adress.ligne1
        });
        if (!address) {
            address = {
                id: uuidv4(),
                line1: row.adress.ligne1,
                zipCode: row.adress.ligne2.split(' ')[0] || "74100",
                city: row.adress.ligne2.split(' ', 2)[1] || "Annemasse"
            }
            addresses.push(address)
        }
        notice.address = address.id;

        // Rest
        notice.parts = parseInt(row.nombreParts);
        notice.recoveryDate = row.dateRecouvrement;
        notice.earningsYear = row.anneeRevenus;
        notice.familyComposition = row.situationFamiliale;
        notice.taxBeforeCorrection = {
            taxable: row.impotsNetAvantCorrections !== 'Non imposable',
            amount: row.impotsNetAvantCorrections !== 'Non imposable' ? getMoneyAmount(row.impotsNetAvantCorrections) : undefined
        };
        notice.taxYear = parseInt(row.anneeImpots);
        notice.tax = {
            taxable: row.impots !== 'Non imposable',
            amount: row.impots !== 'Non imposable' ? getMoneyAmount(row.impots) : undefined
        };
        notice.globalEarnings = getMoneyAmount(row.revenuBrutGlobal);
        notice.taxableEarnings = getMoneyAmount(row.revenuImposable);
        notice.referenceEarnings = getMoneyAmount(row.revenuFiscalReference);
        notice.dependents = parseInt(row.nombreDePersonneACharge);
        notice.statementDate = row.dateEtablissement;
        notice.partialSituation = row.situationPartielle !== '' ? row.situationPartielle : undefined;
        notice.correctionError = row.erreurCorrectif !== '' ? row.erreurCorrectif : undefined;
        notice.noticeNumber = id.split('+')[1];
        notice.taxNumber = id.split('+')[0];

        return notice;
    })

    // Write identities to files
    identities.forEach((identity) => {
        fs.writeFile(
            `../../svair-mock-data/data/people/${identity.id}.json`,
            JSON.stringify(identity),
            () => {}
        );
    });

    // Write addresses to files
    addresses.forEach((address) => {
        fs.writeFile(
            `../../svair-mock-data/data/addresses/${address.id}.json`,
            JSON.stringify(address),
            () => {}
        );
    });

    // Write notices to files
    notices.forEach((notice) => {
        fs.writeFile(
            `../../svair-mock-data/data/notices/${notice.taxNumber}_${notice.noticeNumber}.json`,
            JSON.stringify(notice),
            () => {}
        );
    });
});
