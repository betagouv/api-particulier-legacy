const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const fs = require("fs");

const { PORT = 3004 } = process.env;

const app = express();

const logger = morgan("combined", {
  stream: fs.createWriteStream(process.env.ACCESS_LOG_PATH || "./access.log", {
    flags: "a"
  })
});

app.use(logger);

app.use(helmet());

// enable all CORS request
app.use(cors());

const cache = new NodeCache({ stdTTL: 30 * 60 });

app.get("/api/stats", (req, res, next) => {
  const success_count_last_30_days = cache.get("success_count_last_30_days");

  if (success_count_last_30_days) {
    return res.json(success_count_last_30_days);
  }

  axios({
    method: "get",
    url: "http://localhost:9200/filebeat-*/_search?pretty",
    data: {
      query: {
        bool: {
          must: [
            {
              range: {
                "@timestamp": {
                  gte: "now-30d"
                }
              }
            },
            {
              match: {
                "status-code": "200"
              }
            },
            {
              exists: {
                field: "consumer.organisation"
              }
            }
          ]
        }
      }
    }
  })
    .then(function({
      data: {
        hits: { total }
      }
    }) {
      console.log("request made to elasticsearch");
      cache.set("success_count_last_30_days", total);

      return res.json(total);
    })
    .catch(function(error) {
      console.error(error);

      return res.sendStatus(500);
    });
});

app.listen(PORT, () => {
  console.log(
    `application is listening on port ${PORT}`
  );
});
