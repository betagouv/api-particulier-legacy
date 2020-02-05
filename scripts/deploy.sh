#!/bin/sh

set -e
set -x

{
logPrefix(){
  echo "$(date --iso-8601=seconds) - $APP_NAME -"
}

if [ -z $1 ]; then
    echo "$(logPrefix) Error: You must provide the application name as an argument. Ex: ./scripts/deploy.sh api-particulier"
    exit 1
fi

APP_NAME=$1
APP_VERSION=master
echo "$(logPrefix) Deploying $APP_NAME..."

echo "$(logPrefix) Preparing installation..."
ROOT_PATH=/opt/apps
APP_PATH=${ROOT_PATH}/${APP_NAME}
TIMESTAMP=$(date +'%Y%m%d%H%M%S')
RELEASES_PATH=${APP_PATH}/releases/${TIMESTAMP}
mkdir -p ${APP_PATH}/releases

echo "$(logPrefix) Fetching archive..."
cd ${APP_PATH}
curl -f -L https://github.com/betagouv/api-particulier/archive/${APP_VERSION}.tar.gz --output ${APP_NAME}-${APP_VERSION}.tar.gz

echo "$(logPrefix) Unpacking..."
tar -xzf ${APP_NAME}-${APP_VERSION}.tar.gz api-particulier-master/${APP_NAME}
mv api-particulier-${APP_VERSION}/${APP_NAME} ${RELEASES_PATH}
rm ${APP_NAME}-${APP_VERSION}.tar.gz

echo "$(logPrefix) Installing..."
cd ${RELEASES_PATH}
export $(cat /etc/${APP_NAME}.conf | xargs)

if [ -e package.json ]; then
    npm i
fi

echo "$(logPrefix) Linking new deployment..."
if [ -h ${APP_PATH}/current ]; then
    rm ${APP_PATH}/current
fi
ln -s ${RELEASES_PATH} ${APP_PATH}/current

echo "$(logPrefix) Restarting service..."
sudo /bin/systemctl restart ${APP_NAME}

echo "$(logPrefix) Removing old releases..."
cd ${APP_PATH}/releases
ls -t . | tail -n +6 | xargs rm -rf

echo "$(logPrefix) Deployment of $APP_NAME successfully completed!"

exit 0
} >> /opt/apps/apps-deployment.log
