import { ObjectID } from 'mongodb';
import { getDatabaseConnection } from '../providers/database';
import { getNewApiKey, hashApiKey } from '../utils/api-key';
import moment from 'moment';
import 'moment/locale/fr';

moment.locale('fr');

const signupHost =
  process.env.SIGNUP_HOST || 'https://signup-development.api.gouv.fr';

const formatTokenGenerationDate = tokenList => {
  tokenList.forEach(token => {
    if (token.hashed_token) {
      token.generatedOn = moment(token.api_key_issued_at).format('LL');
    }
  });
};

export const getUserTokenList = async (req, res, next) => {
  try {
    const databaseConnection = await getDatabaseConnection();

    const tokenList = await databaseConnection
      .collection('tokens')
      .find({
        email: req.session.email,
      })
      .sort({ created_at: -1 })
      .toArray();

    formatTokenGenerationDate(tokenList);

    return res.render('dashboard/token-list', {
      tokenList,
      layout: 'dashboard',
      signupHost,
      user: req.session,
    });
  } catch (e) {
    next(e);
  }
};

export const generateNewUserApiKey = async (req, res, next) => {
  try {
    const databaseConnection = await getDatabaseConnection();

    const token = await databaseConnection
      .collection('tokens')
      .findOne({ _id: ObjectID(req.params.id) });

    if (token.hashed_token) {
      return next(
        new Error('You cannot generate a new token if you already have one')
      );
    }

    if (token.email !== req.session.email) {
      return next(
        new Error("You cannot generate a new token if you don't own it")
      );
    }

    const newApiKey = getNewApiKey();

    const hashedApiKey = hashApiKey(newApiKey);

    const { value: newToken } = await databaseConnection
      .collection('tokens')
      .findOneAndUpdate(
        { _id: ObjectID(req.params.id) },
        {
          $set: {
            hashed_token: hashedApiKey,
            api_key_issued_at: new Date().toISOString(),
          },
        },
        { returnOriginal: false }
      );

    const tokenList = await databaseConnection
      .collection('tokens')
      .find({
        email: req.session.email,
      })
      .sort({ created_at: -1 })
      .toArray();

    formatTokenGenerationDate(tokenList);

    tokenList.forEach(element => {
      if (element._id.toString() === req.params.id) {
        element.newlyGeneratedApiKey = newApiKey;
      }
    });

    return res.render('dashboard/token-list', {
      tokenList,
      layout: 'dashboard',
      signupHost,
      user: req.session,
    });
  } catch (e) {
    next(e);
  }
};
