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

### Local installation

- `git clone --recursive git@github.com:betagouv/api-particulier-ansible.git`
- `cd api-particulier-ansible`
- `make install`

> **Troubleshooting:** The provisioning might fail on the "elasticsearch : set java heap size (min size)" task. If you encounter this problem, just run `make` again.

## Help

`make`

## Usage

### Postman collection

To facilitate local development, a [Postman](https://www.getpostman.com/) configuration has been generated during the installation.

To load the Postman configuration:

- import your local version of `development/local.postman_environement.json` in Postman.
- import `postman/api-particulier.postman_collection.json` in postman.

You should now be able to use all the routes in the Postman collection.

> Note that fake data can be found [here](https://github.com/betagouv/svair-mock/blob/f2c26f70eb985b44a97d1e4bab8bdee8c0439223/data/seed.csv) and [here](https://github.com/betagouv/api-particulier/blob/1fc0a91cf07d041ce8d21f23f4288ca077b81bd6/api/caf/fake-responses.json).

### Local monitoring

> Note that the monitoring VM must be started explicitly with `vagrant up monitoring` and will not be started with `vagrant up`.
> It is more convenient as it is not used quite often in development mode whereas it demands lots of RAM and CPU to run.

Go to https://monitoring.particulier-development.api.gouv.fr (credentials: octo|thereisabetterway).

Create an index pattern `filebeat-*` and select `@timestamp` as `Time Filter field name`.

Make an api call with Postman.

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
vagrant ssh app
sudo systemctl stop api-particulier
cd /opt/apps/api-particulier/current
export $(cat /etc/api-particulier/api-particulier.conf | xargs)
npm start
```

Svair mock:

```bash
vagrant ssh app
sudo systemctl stop svair-mock
cd /opt/apps/svair-mock/current
export $(cat /etc/svair-mock/svair-mock.conf | xargs)
npm start
```

## Global architecture

[![architecture](https://docs.google.com/drawings/d/e/2PACX-1vTZql6aJMbkmMiIxRy89SFPch5K-tTNIXVBv1ElXhpESRp43dSRGALdRi3ZNYsf5JlbukIN70HQv5RQ/pub?w=960&h=720)](https://docs.google.com/drawings/d/1p-v88uBrFbKMBLRKEmsrSeNWprJqnzsy08SBrQx6U4c/edit?usp=sharing)
