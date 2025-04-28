/* eslint-disable node/no-unpublished-require */
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../src/app');
const {
  CreateCategory,
  createAdminUser,
  createReqularUser,
  createJWTToken,
  deleteAllCategories,
  createCategory,
  // deleteAllCategories,
} = require('../helpers/helper');

let adminToken;
let categoryId;
let userToken;
let mongoServer;
// let productId;

beforeAll(async () => {
  // Start MongoDB in-memory server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {});

  // create admin and regular user
  const adminUser = await createAdminUser(); // Await user creation
  adminToken = createJWTToken(adminUser._id); // Generate token after user is created
  const regularUser = await createReqularUser(); // Await user creation
  userToken = createJWTToken(regularUser._id); // Generate token after user is created
});

afterEach(async () => {
  await deleteAllCategories();
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase(); // Clean up the database
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Testing cateory routes ', () => {
  describe('/api/v1/cateories', () => {
    describe('GET', () => {
      test('should return an array of products', async () => {
        const response = await supertest(app).get('/api/v1/categories');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data.documents)).toBeTruthy();
      });
    });

    describe('POST', () => {
      describe('without a login token', () => {
        test('should return 401 Unauthorized', async () => {
          const response = await supertest(app)
            .post('/api/v1/categories')
            .send({
              name: 'Test Category',
            });
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });

      describe('with regular user token', () => {
        test('Should returns 403 Forbidden', async () => {
          const response = await supertest(app)
            .post('/api/v1/categories')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Test Category',
            });

          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with Admin token', () => {
        describe('with all required fields', () => {
          test('should Return 201 Created', async () => {
            const response = await supertest(app)
              .post('/api/v1/categories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'test category',
              });

            expect(response.status).toBe(201);
            expect(response.body.data.doc).toHaveProperty(
              'name',
              'test category',
            );
          });
        });

        describe('with missing name', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/categories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('category name required');
          });
        });

        describe('with short name', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/categories')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'ab',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Too short category name');
          });
        });
      });
    });
  });

  describe('/api/v1/products/:id', () => {
    describe('GET', () => {
      describe('with valid id', () => {
        test('should return a single category', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app).get(
            `/api/v1/categories/${newCategory._id}`,
          );
          expect(response.status).toBe(200);
          expect(response.body.data.doc).toHaveProperty(
            'name',
            'Test Category',
          );
        });
      });
      describe('with invalid id', () => {
        test('should return 400 Bad Request', async () => {
          const response = await supertest(app).get(
            '/api/v1/categories/invalidId',
          );
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid category id');
        });
      });
      describe('with non-existing id', () => {
        test('should return 404 Not Found', async () => {
          const response = await supertest(app).get(
            '/api/v1/categories/646f3b0c4d5e8a3d4c8b4567',
          );
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No Document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });
    });

    describe('PATCH', () => {
      describe('with valid id', () => {
        test('should update the category', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app)
            .patch(`/api/v1/categories/${newCategory._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Category',
            });
          expect(response.status).toBe(200);
          expect(response.body.data.doc).toHaveProperty(
            'name',
            'Updated Category',
          );
        });
      });

      describe('with invalid id', () => {
        test('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch('/api/v1/categories/invalidId')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid category id');
        });
      });

      describe('with non-existing id', () => {
        test('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .patch('/api/v1/categories/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });

      describe('with regular user token', () => {
        test('should return 403 Forbidden', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app)
            .patch(`/api/v1/categories/${newCategory._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        test('should return 401 Unauthorized', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app)
            .patch(`/api/v1/categories/${newCategory._id}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });
    });

    describe('DELETE', () => {
      describe('with valid id', () => {
        test('should delete the product', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app)
            .delete(`/api/v1/categories/${newCategory._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(204);
        });
      });

      describe('with invalid id', () => {
        test('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .delete('/api/v1/categories/invalidId')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid category id');
        });
      });

      describe('with non-existing id', () => {
        test('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .delete('/api/v1/categories/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });

      describe('with regular user token', () => {
        test('should return 403 Forbidden', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app)
            .delete(`/api/v1/categories/${newCategory._id}`)
            .set('Authorization', `Bearer ${userToken}`);
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        test('should return 401 Unauthorized', async () => {
          const newCategory = await createCategory();
          const response = await supertest(app).delete(
            `/api/v1/categories/${newCategory._id}`,
          );
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });
    });
  });
});
