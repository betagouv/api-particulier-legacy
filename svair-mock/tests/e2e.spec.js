require("dotenv").config();
const request = require("supertest");
const app = require("../app");

describe("The mock application", () => {
  let server;

  it("renders a mocked html page when called with test inputs", () => {
    server = request(app)
      .post("/secavis/faces/commun/index.jsf")
      .send("j_id_7:j_id_l=Valider")
      .send("j_id_7_SUBMIT=1")
      .send("j_id_7:spi=1802599999001")
      .send("j_id_7:num_facture=1802599999001")
      .expect(200)
      .then((response) => {
        expect(response.text).toMatchSnapshot();
      });

    return server;
  });

  afterAll(() => {
    server.stop();
  });
});
