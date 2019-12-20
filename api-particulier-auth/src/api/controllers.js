import { isEmpty, isString } from 'lodash';
import * as js2xmlparser from 'js2xmlparser';

import { getDatabaseConnection } from '../providers/database';
import { hashApiKey } from '../utils/api-key';

export const pingController = (req, res, next) => res.json('pong');

export const authorizeController = async (req, res, next) => {
  try {
    let apiKey = req.get('X-API-Key');

    // DEPRECATED: the apiKey is to be read from headers only
    if (req.query.token && !isString(apiKey)) {
      apiKey = req.query.token;
    }

    if (!isString(apiKey)) {
      throw new Error('API key not found');
    }

    const databaseConnection = await getDatabaseConnection();

    const hashedApiKey = hashApiKey(apiKey);

    const token = await databaseConnection.collection('tokens').findOne(
      {
        hashed_token: hashedApiKey,
      },
      { projection: { _id: 1, name: 1, email: 1, signup_id: 1, scopes: 1 } }
    );

    if (isEmpty(token)) {
      throw new Error('token not found');
    }

    const data = {
      _id: token._id.toString(),
      name: token.name,
      email: token.email,
      scopes: token.scopes,
    };

    return res.format({
      'application/json': function() {
        res.json(data);
      },
      'application/xml': function() {
        res.send(
          js2xmlparser.parse(
            'result',
            typeof data === 'string' ? { data } : data
          )
        );
      },
      default: function() {
        res.json(data);
      },
    });
  } catch (error) {
    next(error);
  }
};
