/* eslint-disable no-undef */
/* eslint-disable node/no-unpublished-require */
/* eslint-disable import/no-extraneous-dependencies */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
  await mongoose.connection.close();
  await mongod.stop();
});
