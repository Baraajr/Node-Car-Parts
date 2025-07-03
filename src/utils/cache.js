const mongoose = require('mongoose');
const { createClient } = require('redis');

const { exec } = mongoose.Query.prototype;

let client;
mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this; // Chainable
};

if (process.env.NODE_ENV !== 'test') {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisUrl = `redis://${redisHost}:${redisPort}`;
  client = createClient({
    url: redisUrl,
  });
  client.on('error', (err) => {
    console.error('Redis Client Error', err);
    process.exit(1);
  });
  client.on('connect', () => {
    console.log('Redis client connected');
  });

  client.connect(); // Important for Redis v4+

  mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
      return exec.apply(this, arguments);
    }

    const key = JSON.stringify({
      query: this.getQuery(), // filters
      collection: this.mongooseCollection.name, // model
      options: this.getOptions(), // sort, skip, limit, etc.
      fields: this._fields, // selected fields
    });

    const cacheValue = await client.hGet(this.hashKey, key);

    if (cacheValue) {
      console.log('from redis');
      const doc = JSON.parse(cacheValue);
      return Array.isArray(doc)
        ? doc.map((d) => new this.model(d))
        : new this.model(doc);
    }

    const result = await exec.apply(this, arguments);
    await client.hSet(this.hashKey, key, JSON.stringify(result));
    await client.expire(this.hashKey, 50000); // Set expiration separately
    console.log('from mongo');

    return result;
  };
}

module.exports = {
  async clearHash(hashKey) {
    if (client) {
      await client.del(JSON.stringify(hashKey));
      console.log('Cache cleared successfully');
    }
  },
};
