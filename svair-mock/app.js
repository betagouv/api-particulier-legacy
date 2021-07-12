require("dotenv").config();
const axios = require("axios");
const express = require("express");
const morgan = require("morgan");
const app = express();
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const path = require("path");
const numeral = require("numeral");
const moment = require("moment");

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_API_URL = process.env.AIRTABLE_API_URL;

numeral.register("locale", "fr", {
  delimiters: {
    thousands: " ",
    decimal: ",",
  },
  abbreviations: {
    thousand: "k",
    million: "m",
    billion: "b",
    trillion: "t",
  },
  ordinal: function (number) {
    return number === 1 ? "er" : "ème";
  },
  currency: {
    symbol: "€",
  },
});
numeral.locale("fr");

const formatMoney = (amount) =>
  amount !== null ? numeral(amount).format("0,0 $") : null;

const formatDate = (date) =>
  date !== null || date !== undefined || date !== ""
    ? moment(date).format("DD/MM/YYYY")
    : null;

app.engine(".hbs", exphbs({ defaultLayout: "single", extname: ".hbs" }));
app.set("view engine", ".hbs");
app.set("views", path.join(__dirname, "views"));
app.use(morgan("combined"));
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.send("Hello World!");
});

app.post("/secavis/faces/commun/index.jsf", function (req, res) {
  const numFiscal = req.body["j_id_7:spi"];
  const referenceAvis = req.body["j_id_7:num_facture"];

  return axios
    .get(`${AIRTABLE_API_URL}/AvisImposition`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      params: {
        filterByFormula: `AND({numeroFiscal}='${numFiscal}', {numeroAvisImposition}='${referenceAvis}')`,
      },
    })
    .then(({ data }) => {
      if (data.records.length === 0) {
        throw new Error("Missing tax notice");
      }
      return data.records[0].fields;
    })
    .then((notice) => {
      return {
        parts: notice.nombreParts,
        recoveryDate: formatDate(notice.dateRecouvrement),
        earningsYear: notice.anneeRevenus,
        familyComposition: notice.situationFamiliale,
        taxBeforeCorrection:
          notice.impotsNetAvantCorrections !== "Non imposable"
            ? formatMoney(notice.impotsNetAvantCorrections)
            : "Non imposable",
        taxYear: notice.anneeImpots,
        tax:
          notice.impots !== "Non imposable"
            ? formatMoney(notice.impots)
            : "Non imposable",
        globalEarnings: formatMoney(notice.revenuBrutGlobal),
        taxableEarnings: formatMoney(notice.revenuImposable),
        referenceEarnings: formatMoney(notice.revenuFiscalReference),
        dependents: notice.nombreDePersonnesACharge,
        statementDate: formatDate(notice.dateEtablissement),
        noticeNumber: notice.numeroAvisImposition,
        taxNumber: notice.numeroFiscal,
        person1: {
          surname: notice["declarant1.nom"],
          name: notice["declarant1.prenoms"],
          birthname: notice["declarant1.nomNaissance"],
          birthdate: formatDate(notice["declarant1.dateNaissance"]),
        },
        person2: {
          surname: notice["declarant2.nom"],
          name: notice["declarant2.prenoms"],
          birthname: notice["declarant2.nomNaissance"],
          birthdate: formatDate(notice["declarant2.dateNaissance"]),
        },
        address: {
          line1: notice["adresse.ligne1"],
          zipCode: notice["adresse.codePostal"],
          city: notice["adresse.commune"],
        },
        partialSituation: notice.situationPartielle,
        correctionError: notice.erreurCorrectif,
        layout: false,
      };
    })
    .then((templateData) => {
      res.render("svair", templateData);
    })
    .catch((error) => {
      console.log(error);
      res.render("missing", { layout: false });
    });
});

app.use("/secavis", express.static(path.join(__dirname, "public")));

module.exports = app;
