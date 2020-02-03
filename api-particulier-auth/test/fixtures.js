import { MongoClient } from 'mongodb';
import crypto from 'crypto';

export const testToken = '59eb9fddb23a05e8c82f922caf6c1733';

export const tokenFixtures = [
  {
    _id: '5bcf377663623910ae9a05ca',
    name: 'COMMUNE DE TEST - 1',
    email: 'test@test',
    signup_id: '1',
    created_at: '2018-12-18T12:48:54.455Z',
    api_key_issued_at: '2018-12-18T12:49:13.948Z',
    scopes: ['dgfip_avis_imposition', 'dgfip_adresse'],
    hashed_token: crypto
      .createHash('sha512')
      .update(testToken)
      .digest('hex'),
  },
];

export const loadFixtures = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'NODE_ENV should be set to test (avoid wiping production database :) )'
    );
  }
  const mongoClient = await MongoClient.connect('mongodb://localhost:27017');
  await mongoClient
    .db('api-particulier-test')
    .collection('tokens')
    .insertMany(tokenFixtures);
  await mongoClient.close();
};

export const cleanFixtures = async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      'NODE_ENV should be set to test (avoid wiping production database :) )'
    );
  }
  const mongoClient = await MongoClient.connect('mongodb://localhost:27017');
  await mongoClient
    .db('api-particulier-test')
    .collection('tokens')
    .drop();
  await mongoClient.close();
};
