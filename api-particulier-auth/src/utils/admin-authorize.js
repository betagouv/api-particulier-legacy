import { isArray } from 'lodash';

const authorize = function () {
  return (req, res, next) => {
    if (!isArray(req.session.roles) || !req.session.roles.includes('api-particulier-token-admin')) {
      return res.sendStatus(403);
    }

    next();
  }
};

export default authorize;
