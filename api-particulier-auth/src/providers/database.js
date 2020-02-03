import { MongoClient } from 'mongodb';

let mongodbConnection = null;

const url = 'mongodb://localhost:27017';
const dbName =
  process.env.NODE_ENV === 'test' ? 'api-particulier-test' : 'api-particulier';

export const getDatabaseConnection = async () => {
  if (mongodbConnection && mongodbConnection.isConnected()) {
    return mongodbConnection.db(dbName);
  }

  mongodbConnection = await MongoClient.connect(url);

  console.log(`Connected to database : ${url}/${dbName}`);

  return mongodbConnection.db(dbName);
};
