FROM kong:latest
ADD ./kong-delegateAuth /usr/local/kong/kong-delegateAuth
WORKDIR /usr/local/kong/kong-delegateAuth
RUN luarocks make --local