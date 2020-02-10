local typedefs = require "kong.db.schema.typedefs"


return {
  name = "key-auth",
  fields = {
    {
      consumer = typedefs.no_consumer
    },
    {
      config = {
        type = "record",
        fields = {
          { authorize_scheme = {type = "string", required = false, default = "http"}, },
          { authorize_host = {type = "string", required = true, default = "localhost"}, },
          { authorize_path = {type = "string", required = false, default = "/authorize"}, },
          { skipped_paths = {type = "array", elements = { type = "string" }, required = false, default = { "/api/ping" }} },
        },
      },
    },
  },
}