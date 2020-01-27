# API Particulier

French government's API providing providing citizens' individual information.

> See [official website](https://particulier.api.gouv.fr/) for more information.

## Installation

### Prerequesites

- [VirtualBox](https://www.virtualbox.org/wiki/Downloads) >= \^5.2.10
- [Vagrant](https://www.vagrantup.com/downloads.html) >= \^2.1.1
- [NFS](https://doc.ubuntu-fr.org/nfs)
- [Ansible](https://docs.ansible.com/ansible/latest/installation_guide/index.html) >= 2.5.15
- [Dnspython](http://www.dnspython.org/)

### Local provisioning

- `git clone --recursive git@github.com:betagouv/api-particulier-ansible.git`
- `cd api-particulier-ansible`
- `make`

### Development deployment

Deploy the application manually.

On the **gateway** server:

```bash
vagrant ssh gateway
cd /opt/apps/api-particulier-auth/current
npm i
sudo systemctl restart api-particulier-auth
exit
```

On the **app1** server:

```bash
vagrant ssh app1
cd /opt/apps/api-particulier/current
npm i
sudo systemctl restart api-particulier
cd /opt/apps/svair-mock/current
npm i
sudo systemctl restart svair-mock
exit
```

On the **app2** server:

```bash
vagrant ssh app2
sudo systemctl restart api-particulier
sudo systemctl restart svair-mock
exit
```

On the **monitoring** server:

```bash
vagrant ssh monitoring
cd /opt/apps/api-stats-elk/current
npm i
sudo systemctl restart api-stats-elk
exit
```

### Test the local installation

To test that the installation went OK, we will now create a token and test it.

Token object are created with signup via an API call on api-particulier-auth.

To simulate this API call run the following curl command:

```bash
curl -k -X POST \
  https://particulier-development.api.gouv.fr/admin/api/token \
  -H 'x-api-key: 4KpfbPeOI00ckHALqlyxR0z5xaKDCZMTareFTR462cgKJrf43EVnkxEJxeWmNSLM' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -d '{
	"name": "MAIRIE DE PARIS - 100",
	"email": "mairie-de-paris@yopmail.com",
	"signup_id": "100",
        "scopes": ["dgfip_avis_imposition", "cnaf_attestation_droits"]
}'
```

Once the token object is created, you must generate an API Particulier api key in it.

Connect to https://particulier-development.api.gouv.fr/admin. Use the public account: api-particulier@yopmail.com (password: api-particulier@yopmail.com).

Then click on "Generate new API Key".

At this step your API Key is displayed. Mind that this key is encrypted and can not be displayed anymore. Copy it, and replace USE_YOUR_OWN in `postman/development.postman_environement.json` with it.

Import your local version of `development/local.postman_environement.json` in [postman](https://www.getpostman.com/).

Import `postman/api-particulier.postman_collection.json` in postman.

You should be able to retrieve data from the caf famille json route: {{dev_host}}/api/caf/famille?numeroAllocataire={{numeroAllocataire}}&codePostal={{codePostal}}

Note that fake data can be found [here](https://github.com/betagouv/svair-mock/blob/f2c26f70eb985b44a97d1e4bab8bdee8c0439223/data/seed.csv) and [here](https://github.com/betagouv/api-particulier/blob/1fc0a91cf07d041ce8d21f23f4288ca077b81bd6/api/caf/fake-responses.json).

### Test the local monitoring

> Note that the monitoring VM must be started explicitly with `vagrant up monitoring` and will not be started with `vagrant up`.
> It is more convenient as it is not used quite often in development mode whereas it demands lots of RAM and CPU to run.

Go to https://monitoring.particulier-development.api.gouv.fr (credentials: octo|thereisabetterway).

Create an index pattern `filebeat-*` and select `@timestamp` as `Time Filter field name`.

Make an api call with postman.

From now on, your request to api-particulier are logged in Kibana. You should see them in the discover section.

You can also test the api-stats-elk api at:

https://monitoring.particulier-development.api.gouv.fr/api/stats/

You can find more info on the [api-particulier repository](https://github.com/betagouv/api-particulier)

You can install the signup application [here](https://github.com/betagouv/signup.api.gouv.fr-docker).

### Run app manually (optional)

After a first successful development deployment, you may want to run the app you are working on interactively.

API Particulier auth:

```bash
vagrant ssh gateway
sudo systemctl stop api-particulier-auth
cd /opt/apps/api-particulier-auth/current/
export $(cat /etc/api-particulier-auth.conf | xargs)
npm start
```

API Particulier:

```bash
vagrant ssh app1
sudo systemctl stop api-particulier
cd /opt/apps/api-particulier/current
export $(cat /etc/api-particulier/api-particulier.conf | xargs)
npm start
```

```bash
vagrant ssh app2
sudo systemctl stop api-particulier
cd /opt/apps/api-particulier/current
export $(cat /etc/api-particulier/api-particulier.conf | xargs)
npm start
```

Svair mock:

```bash
vagrant ssh app1
sudo systemctl stop svair-mock
cd /opt/apps/svair-mock/current
export $(cat /etc/svair-mock/svair-mock.conf | xargs)
npm start
```

```bash
vagrant ssh app2
sudo systemctl stop svair-mock
cd /opt/apps/svair-mock/current
export $(cat /etc/svair-mock/svair-mock.conf | xargs)
npm start
```

### Production-like deployment (optional)

For development purpose you may want to have a local iso-production application running. You can do it by running the deployment script instead of processing to a development deployment:

```bash
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventories/development/hosts deploy.yml
```

## Global architecture

[![architecture](https://docs.google.com/drawings/d/e/2PACX-1vTZql6aJMbkmMiIxRy89SFPch5K-tTNIXVBv1ElXhpESRp43dSRGALdRi3ZNYsf5JlbukIN70HQv5RQ/pub?w=960&h=720)](https://docs.google.com/drawings/d/1p-v88uBrFbKMBLRKEmsrSeNWprJqnzsy08SBrQx6U4c/edit?usp=sharing)

## Chiffrer un certificat à déployer

Certains fichiers sont intégralement chiffré sans l'aide de Ansible Vault.
Pour en créer, utilisez cette démarche :

    openssl aes-256-cbc -a -in mon.cert -out mon.cert.enc

utilisez le mot de passe qui est dans secrets/certificates.yml

    ansible-vault edit secrets/certificates.yml

## Déployer en production

### Configure staging instance

First you need to install Python 2.7 on every server. Connect to each server then run:

```bash
sudo apt install -y python
```

Do not forget to generate new certificate for this instance (see _Generate new certificate_ section bellow).

Then run the ansible configuration script:

```bash
ansible-playbook -i inventories/staging/hosts configure.yml
```

> Note that only the dev whose ssh key is provisioned in the ovh interface can execute this playbook for the first time

### Deploy staging instance

Use the following command to deploy api-particulier, api-particulier-auth & svair-mock:

```bash
ansible-playbook -i inventories/staging/hosts deploy.yml
```

Use the following command to deploy <app_name> only (app_name can be one of : api-particulier, api-particulier-auth, svair-mock):

```bash
ansible-playbook -i inventories/staging/hosts deploy.yml -t <app_name>
```

### Generate api particulier API Keys on test instance

There is no signup test instance nor oauth test instance.
So we generate the API Key manually by writing in the database with mongo client CLI.

#### 1. Generate the api key

We manually execute the [token generation script](https://github.com/betagouv/api-particulier-auth/blob/master/src/utils/api-key.js) with any local node installation.

```bash
node
```

```js
const crypto = require("crypto");
// apiKey is shorten than production api keys to be more easy to use
const apiKey = crypto.randomBytes(16).toString("hex");
const hash = crypto
  .createHash("sha512")
  .update(apiKey)
  .digest("hex");
console.log(apiKey);
console.log(hash);
```

#### 2. Create token in api-particulier-auth

Connect to gateway-test. Then:

```bash
mongo
```

```mongodb
use api-particulier
db.tokens.insert({
  name: "Mairie de Test",
  email: "contact@mairiedetest.fr",
  hashed_token: "<REPLACE WITH HASH FROM PREVIOUS STEP>",
  scopes: [ "dgfip_avis_imposition", "cnaf_attestation_droits" ]
})

// find the id of your token with
db.tokens.find()

db.tokens.update(
  { _id: ObjectId("<THE ID OF THE NEW TOKEN>") },
  { $set: { "signup_id" : "no-signup-<THE ID OF THE NEW TOKEN>" } }
)
```

You can now use the new API key.

### Generate token for api-particulier-auth api admin

Signup will push information to api-particulier-auth when a contract is validated.
To securely push data, signup will authenticate on api-particulier-auth with an API Key.
The following lines describe how to setup such a key.

First generate a random string and store it in 'api_particulier_api_key' in 'signup-ansible/inventories/development/group_vars/signup.yml'.

Then deploy the new configuration with:

```bash
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventories/development/hosts configure.yml -t signup-back
```

Hash it with bcrypt:

```bash
cd api-particulier-auth
node --require bcryptjs
```

```js
const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync("your-random-string-here", salt);
console.log(hash);
```

Store the output in 'hashed_signup_api_key' in 'api-particulier-ansible/inventories/development/group_vars/gateway.yml'.

Eventually, deploy the new configuration with:

```bash
ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i inventories/development/hosts configure.yml -t api-particulier-auth
```

## Maintenance

### Ajouter un accès à api-particulier-auth

Dans la base 'api-auth':

```postgres-sql
UPDATE users SET roles = array_append(roles,'api-particulier-token-admin') WHERE email = 'particulier@domain.user';
```

### Publier api-particulier dans Kong

```bash
ansible-playbook --tags "publish-api-particulier" -i inventories/development/hosts configure.yml
```

### Load balancer les IPs sortantes

```bash
ansible-playbook --tags "ips-load-balancing" -i inventories/development/hosts configure.yml
```

### Generate new certificate

Change to certificates directory:

```bash
cd certificates
```

Generate certificate for both app and monitoring domain. Run the following script and follow the outputed instructions:

```bash
./generate.sh
```

Encrypt the certificates:

```bash
cd ..
ansible-vault encrypt certificates/development/*
```

Run the configuration scripts:

```bash
ansible-playbook -i inventories/development/hosts configure.yml
```
