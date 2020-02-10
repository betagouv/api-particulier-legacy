import express from 'express';
import sessions from 'client-sessions';
import { isEmpty } from 'lodash';
import oauth2 from 'simple-oauth2';
import axios from 'axios';

/*
 * This function returns a router that take care of the authentication process via oauth2.
 * The session is saved client side with token.
 */
const authenticate = function({
  oauthHost,
  oauthUserInfoURL,
  clientID,
  clientSecret,
  host,
  mountPointPath,
  sessionSecret,
}) {
  const oauthCallbackPath = '/oauth-callback';

  // Configure Oauth2 authentication
  const credentials = {
    client: {
      id: clientID,
      secret: clientSecret,
    },
    auth: { tokenHost: oauthHost },
  };

  const oauth2Client = oauth2.create(credentials);

  // Creating a router to add authentication callback on it
  const authRouter = express.Router();

  // Configuring session cookie middleware
  authRouter.use(
    sessions({
      cookieName: 'session', // cookie name dictates the key name added to the request object
      secret: sessionSecret, // should be a large unguessable string
      duration: 2 * 60 * 60 * 1000, // how long the session will stay valid in ms
      cookie: {
        path: mountPointPath, // cookie will only be sent to requests under '/api'
        httpOnly: true, // when true, cookie is not accessible from javascript
        secureProxy: process.env.SECURE_PROXY === 'true',
      },
    })
  );

  authRouter.use((req, res, next) => {
    if (req.path === oauthCallbackPath) {
      return next();
    }

    if (isEmpty(req.session)) {
      const authorizationUri = oauth2Client.authorizationCode.authorizeURL({
        redirect_uri: `${host}${mountPointPath}${oauthCallbackPath}`,
        scope: 'openid email roles',
        state: `${req.originalUrl || '/admin/'}`,
      });

      return res.redirect(authorizationUri);
    }

    next();
  });

  authRouter.get(oauthCallbackPath, async (req, res, next) => {
    try {
      if (req.query.error) {
        throw new Error(`Oauth server says: ${req.query.error}, ${req.query.error_description}`)
      }

      const originalUrl = req.query.state;

      const tokenConfig = {
        code: req.query.code,
        redirect_uri: `${host}${mountPointPath}${oauthCallbackPath}`,
        scope: [],
      };

      const result = await oauth2Client.authorizationCode.getToken(tokenConfig);

      const { data: userInfo } = await axios({
        method: 'GET',
        headers: { Authorization: `Bearer ${result.access_token}` },
        url: oauthUserInfoURL,
      });

      req.session = userInfo;

      res.redirect(originalUrl);
    } catch (error) {
      console.error(error);
      res.sendStatus(401);
    }
  });

  return authRouter;
};

export default authenticate;
