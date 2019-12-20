import crypto from 'crypto';

export const getNewApiKey = () => {
  return crypto.randomBytes(48).toString('hex');
};

export const hashApiKey = apiKey => {
  return crypto
    .createHash('sha512')
    .update(apiKey)
    .digest('hex');
};
