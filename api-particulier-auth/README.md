# API Particulier auth

La brique d'autorisation de API Particulier.

C'est un référentiel qui associe un identifiant de fournisseur de service à une liste de scopes autorisés.

La brique d'autorisation d'api particulier permet lors de la réception d'un token fourni par un fournisseur de
service de récupérer en retour la liste des scopes auquels ce fournisseur de service à accès.

## Run the tests

To run the tests, you will need a mongodb instance running on http://localhost:27017 (default mongodb port).

You will also need node 8.12.

Install the dependencies
```bash
npm install
```

Run the tests
```bash
npm test
```

## How to run api-particulier

API Particulier auth is part of the API Particulier ecosystem.

The instructions to install the whole API Particulier ecosystem is available on a [private gitlab](https://gitlab.incubateur.net/beta.gouv.fr/api-particulier-ansible).
