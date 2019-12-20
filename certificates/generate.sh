#!/usr/bin/env bash
set -eu

ENV=""
APP_NAME=""
CN=""
SAN=""
CONCAT_TO_PEM=false

function show_usage() {
  echo "  Example use:"
  echo "  $> ./generate.sh --env development --app-name monitoring --cn monitoring-development.particulier-infra.api.gouv.fr"
  echo "  $> ./generate.sh --env development --app-name api-particulier --cn gateway-development.particulier-infra.api.gouv.fr"
}

while [[ $# -gt 0 ]] ; do
    case "${1}" in
  --help) show_usage
    exit 0;
    break
  ;;
  --env)
    ENV="$2";
    shift
  ;;
  --app-name)
    APP_NAME="$2";
    shift
  ;;
  --san)
    SAN="$2";
    shift
  ;;
  --cn)
    CN="$2";
    shift
  ;;
  --concat-to-pem)
    CONCAT_TO_PEM=true;
  ;;

  esac
  shift
done

if [[ -z ${ENV} || -z ${APP_NAME} || -z ${CN} ]]; then
  show_usage
  exit 0
fi

if [[ -z ${SAN} ]] ; then
  SAN="DNS:${CN}"
fi

if [ ! -d "${ENV}" ]; then
    mkdir "${ENV}"
fi

#########
## CA ###
#########

if ! [[ -f "${ENV}/${APP_NAME}-CA.pem" ]] ; then
  # New CA:
  echo "=== Create new CA for ${ENV}/${APP_NAME}"
  openssl req -nodes -new -x509 \
    -subj "/C=FR/ST=IDF/L=Paris/O=DINSIC/OU=OPS/CN=Internal ${ENV} ${APP_NAME} CA" \
    -out "${ENV}/${APP_NAME}-CA.pem" -keyout "${ENV}/${APP_NAME}-CA.key" -days 3650
fi


################
## CSR / KEY ###
################

if ! [[ -f "${ENV}/${APP_NAME}.csr" ]] ; then
  echo "=== Create new csr for ${CN}"
  if [[ -f "${ENV}/${APP_NAME}.key" ]] ; then
    echo "=== Using existing key"
    openssl req -new -key "${ENV}/${APP_NAME}.key" -nodes -out "${ENV}/${APP_NAME}.csr" \
      -subj "/C=FR/ST=IDF/L=Paris/O=DINSIC/OU=OPS/CN=${CN}" -reqexts SAN \
      -config <(cat ./openssl.cnf <(printf "[SAN]\nsubjectAltName=${SAN},DNS:localhost,IP:127.0.0.1")) -days 3650
  else
    openssl req -nodes -newkey rsa:4096 -sha256 -keyout "${ENV}/${APP_NAME}.key" -out "${ENV}/${APP_NAME}.csr" \
      -subj "/C=FR/ST=IDF/L=Paris/O=DINSIC/OU=OPS/CN=${CN}" -reqexts SAN \
      -config <(cat ./openssl.cnf <(printf "[SAN]\nsubjectAltName=${SAN},DNS:localhost,IP:127.0.0.1")) -days 3650
  fi
fi


#####################
## SIGNIN WITH CA ###
#####################
if ! [[ -f "${ENV}/${APP_NAME}.crt" ]] ; then
  echo "=== Create crt for ${ENV}/${CN}"
  openssl x509 -req -extfile <(printf "[SAN]\nsubjectAltName=${SAN},DNS:localhost,IP:127.0.0.1") -extensions SAN -in "${ENV}/${APP_NAME}.csr" -CA "${ENV}/${APP_NAME}-CA.pem" -CAkey "${ENV}/${APP_NAME}-CA.key" -set_serial 00 -out "${ENV}/${APP_NAME}.crt" -days 3650
fi

if [[ "${CONCAT_TO_PEM}" = true ]] ; then
  echo "=== Concat to pem"
  cat  "${ENV}/${APP_NAME}.crt" "${ENV}/$${APP_NAME}.key" > "${ENV}/${APP_NAME}.pem"
fi
