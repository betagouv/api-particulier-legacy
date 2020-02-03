return {
  no_consumer = false, -- this plugin is available on APIs as well as on Consumers,
  fields = {
    authorize_scheme = {type = "string", required = true, default = "http"},
    authorize_host = {type = "string", required = true, default = "localhost"},
    authorize_path = {type = "string", required = true, default = "/authorize"},
    skipped_paths = {type = "array", required = false, default = "/api/ping"}
  },
  self_check = function(schema, plugin_t, dao, is_updating)
    -- perform any custom verification
    return true
  end
}
