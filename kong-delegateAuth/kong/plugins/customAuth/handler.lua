local http = require "resty.http"
local cjson = require "cjson"
local table = require "table"

local plugin = require("kong.plugins.base_plugin"):extend()

function strjoin(delimiter, list)
   local len = table.getn(list)
   if len == 0 then
      return ""
   end
   return table.concat(list, delimiter)
end

function plugin:new()
  plugin.super.new(self, "customAuth")
end

function plugin:init_worker(config)
  plugin.super.init_worker(self)
end

function plugin:access(conf)
  plugin.super.access(self)


  local httpc = http:new()

  if has_value(conf.skipped_paths, ngx.var.uri) then
    return
  end

  local headers = ngx.req.get_headers()
  headers['host'] = nil
  headers['accept'] = "application/json"
  local res, err = httpc:request_uri(plugin:authorize_url(conf), {
    method = "GET",
    path = conf.authorize_path,
    headers = headers
  })

  if not res then
    return plugin:exit_unauthorized(err)
  end

  if res.status == 200 then
    local body = cjson.decode(res.body)
    ngx.req.set_header('X-User-Id', body['_id'])
    ngx.req.set_header('X-User-Name', body['name'])
    ngx.req.set_header('X-User-Scopes', strjoin(' ', body['scopes']))
    return
  end

  plugin:exit_unauthorized(res.body)
end

function plugin:authorize_url(conf)
  return conf.authorize_scheme .. "://" .. conf.authorize_host .. conf.authorize_path
end

function plugin:exit_unauthorized(reason)
  if reason == nil then reason = "" end

  ngx.status = ngx.HTTP_UNAUTHORIZED

  ngx.header["Content-Type"] = "application/json"
  ngx.say(reason)
  ngx.exit(ngx.HTTP_UNAUTHORIZED)
end

function has_value (tab, val)
    for index, value in ipairs(tab) do
        if value == val then
            return true
        end
    end

    return false
end

plugin.PRIORITY = 1000

return plugin
