import express from 'express';
import sessions from 'client-sessions';
import { isEmpty } from 'lodash';
import { Issuer, generators } from 'openid-client'

/*
 * This function returns a router that take care of the authentication process via oauth2.
 * The session is saved client side with token.
 */
const authenticate = function({
  oauthHost,
  clientID,
  clientSecret,
  host,
  mountPointPath,
  sessionSecret,
}) {
  const oauthCallbackPath = '/oauth-callback';
  // Creating a router to add authentication callback on it
  const authRouter = express.Router();

  Issuer.discover(`${oauthHost}/.well-known/openid-configuration`)
    .then(authApiIssuer => {
      const authApiClient = new authApiIssuer.Client({
        client_id: clientID,
        client_secret: clientSecret,
        redirect_uris: [`${host}${mountPointPath}${oauthCallbackPath}`],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_post'
      })
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
          const nonce = generators.nonce();
          const state = generators.state();
          const authorizationUri = authApiClient.authorizationUrl({
            redirect_uri: `${host}${mountPointPath}${oauthCallbackPath}`,
            scope: 'openid email roles',
            state,
            nonce
          });

          req.session.nonce = nonce;
          req.session.state = state;
          req.session.originalUrl = req.originalUrl;

          return res.redirect(authorizationUri);
        }

        next();
      });

      authRouter.get(oauthCallbackPath, async (req, res, next) => {
        try {
          const params = authApiClient.callbackParams(req);
          const tokenSet = await authApiClient.callback(`${host}${mountPointPath}${oauthCallbackPath}`, params, {
            state: req.session.state,
            nonce: req.session.nonce
          })
          delete req.session.nonce;
          delete req.session.state;
          const { originalUrl } = req.session;

          const userInfo = await authApiClient.userinfo(tokenSet.access_token);
          req.session = userInfo;

          res.redirect(originalUrl);
        } catch (error) {
          console.error(error);
          res.sendStatus(401);
        }
      });
    });
  return authRouter;
};

export default authenticate;
