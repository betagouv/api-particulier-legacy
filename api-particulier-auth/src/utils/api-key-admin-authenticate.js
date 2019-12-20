import bcryptjs from 'bcryptjs';

const authenticate = function(hashedAPIKey) {
  return async (req, res, next) => {
    try {
      const apiKey = req.header('x-api-key');

      const isMatch = await bcryptjs.compare(apiKey || '', hashedAPIKey);

      if (!isMatch) {
        return res.sendStatus(401);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default authenticate;
