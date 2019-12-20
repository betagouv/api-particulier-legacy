# Kong plugin for API Particulier authorization

This plugin filters requests with a given API key authorization server

## Pré-requis

- Lua
- luarocks :  https://github.com/luarocks/luarocks
- kong : https://getkong.org/

## Development

For code change on your host to take effect in your vagrant, run the following commands:
```bash
vagrant ssh gateway
sudo su -
cd /root/kong-delegateAuth-master/
luarocks make
service kong restart
```


Logs can be found at `/usr/local/kong/logs/`.

## Test

### Dependencies

In your vagrant, install busted:

```bash
vagrant ssh gateway
sudo su -
cd /root/kong-delegateAuth-master/
luarocks install busted
```

Then create the test database:

```bash
vagrant ssh gateway
sudo su - postgres
psql -c "CREATE DATABASE kong_tests OWNER kong"
```

### Run the tests

```bash
vagrant ssh gateway
sudo su -
cd /root/kong-delegateAuth-master/
PATH=$PATH:/usr/local/openresty/bin/ AUTH_API_KEY=<YOUR_API_KEY_HERE> ./bin/busted
```
