local helpers = require "spec.helpers"
local handler = require "kong.plugins.customAuth.handler"
local say = require("say")
local cjson = require "cjson"

local function has_property(state, arguments)
  local has_key = false

  if not type(arguments[1]) == "table" or #arguments ~= 2 then
    return false
  end

  for key, value in pairs(arguments[1]) do
    if key == arguments[2] then
      has_key = true
    end
  end

  return has_key
end

local api_key = os.getenv("AUTH_API_KEY")

say:set("assertion.has_property.positive", "Expected %s \nto have property: %s")
say:set("assertion.has_property.negative", "Expected %s \nto not have property: %s")
assert:register("assertion", "has_property", has_property, "assertion.has_property.positive", "assertion.has_property.negative")

describe("custom-auth: customAuth (access)", function()
  local client

  setup(function()
    local apiOK = assert(helpers.dao.apis:insert {
        name = "api-OK",
        hosts = { "ok.com" },
        upstream_url = "http://mockbin.org",
    })

    assert(helpers.dao.plugins:insert {
      api_id = apiOK.id,
      name = "customAuth",
      config = {
        authorize_scheme = "http",
        authorize_host = "localhost:7000",
        authorize_path = "/api/auth/authorize"
      }
    })

    local apiNOK = assert(helpers.dao.apis:insert {
        name = "api-NOK",
        hosts = { "nok.com" },
        upstream_url = "http://httpbin.org",
    })

    local config = {}
    assert(helpers.dao.plugins:insert {
      api_id = apiNOK.id,
      name = "customAuth",
      config = {
        authorize_scheme = "http",
        authorize_host = "httpbin.org",
        authorize_path = "/boom",
        skipped_paths = {"/ip"}
      }
    })

    -- start kong, while setting the config item `custom_plugins` to make sure our
    -- plugin gets loaded
    assert(helpers.start_kong {custom_plugins = "customAuth"})
  end)

  teardown(function()
    helpers.stop_kong()
  end)

  before_each(function()
    client = helpers.proxy_client()
  end)

  after_each(function()
    if client then client:close() end
  end)

  it("should build authorize url", function()
    local conf = {
      authorize_scheme = "http",
      authorize_host = "test.host",
      authorize_path = "/authorize"
    }
    local url = handler:authorize_url(conf)
    assert.are.equals(url, "http://test.host/authorize")
  end)

  describe("it requests OKAPI (auth service respond 200)", function()
    it("should authorize on a 200 response from authorize service", function()
      local r = assert(client:send {
        method = "GET",
        path = "/request",
        headers = {
          host = "ok.com",
          ['x-api-key'] = api_key
        }
      })

      assert.response(r).has.status(200)
    end)

    it("should authorize on a 200 response from authorize service even when requesting XML", function()
      local r = assert(client:send {
        method = "GET",
        path = "/request",
        headers = {
          host = "ok.com",
          ['x-api-key'] = api_key,
          ['Accept'] = "application/xml"
        }
      })

      assert.response(r).has.status(200)
    end)

    it("should set X-User-Id header", function()
      local r = assert(client:send {
        method = "GET",
        path = "/request",
        headers = {
          host = "ok.com",
          ['x-api-key'] = api_key
        }
      })

      local body = cjson.decode(r.body_reader())

      assert.has_property(body['headers'], 'x-user-id')
    end)

    it("should set X-User-Name header", function()
      local r = assert(client:send {
        method = "GET",
        path = "/request",
        headers = {
          host = "ok.com",
          ['x-api-key'] = api_key
        }
      })

      local body = cjson.decode(r.body_reader())

      assert.has_property(body['headers'], 'x-user-name')
    end)

    it("should set X-User-Scopes header", function()
      local r = assert(client:send {
        method = "GET",
        path = "/request",
        headers = {
          host = "ok.com",
          ['x-api-key'] = api_key
        }
      })

      local body = cjson.decode(r.body_reader())

      assert.has_property(body['headers'], 'x-user-scopes')
    end)
  end)

  describe("it request NOKAPI (auth service does not respond 200)", function()
    it("You shall not pass", function()
      local r = assert(client:send {
        method = "GET",
        path = "/request",
        headers = {
          host = "nok.com"
        }
      })

      assert.response(r).has.status(401)
    end)

    it("You shall pass if in skipped_paths", function()
      local r = assert(client:send {
        method = "GET",
        path = "/ip",
        headers = {
          host = "nok.com"
        }
      })

      assert.response(r).has.status(200)
    end)

    it("You shall pass if in skipped_paths with query params", function()
      local r = assert(client:send {
        method = "GET",
        path = "/ip?test=test",
        headers = {
          host = "nok.com"
        }
      })

      assert.response(r).has.status(200)
    end)
  end)
end)
