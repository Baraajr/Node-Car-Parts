/**
 * this method is used to clean the redis database in case we post a new blog post
 */
const { clearHash } = require('../utils/cache');

module.exports = async (req, res, next) => {
  await next(); // this will make sure to wait the next middleware which is the post request

  clearHash(req.user.id);
};
