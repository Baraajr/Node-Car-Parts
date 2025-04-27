/* eslint-disable node/no-unpublished-require */
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
const supertest = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../../src/app');
const {
  CreateCategory,
  createProduct,
  createAdminUser,
  createReqularUser,
  createJWTToken,
  deleteAllProducts,
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

  // create category
  const category = await CreateCategory();
  categoryId = category._id;
});

afterEach(async () => {
  await deleteAllProducts();
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase(); // Clean up the database
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Testing Products routes ', () => {
  describe('/api/v1/products', () => {
    describe('GET', () => {
      test('should return an array of products', async () => {
        const response = await supertest(app).get('/api/v1/products');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data.documents)).toBeTruthy();
      });
    });

    describe('POST', () => {
      describe('without a login token', () => {
        test('should return 401 Unauthorized', async () => {
          const response = await supertest(app).post('/api/v1/products').send({
            name: 'Test Product 2',
            price: 200,
            description: 'Test product description 2',
            category: categoryId,
            quantity: 5,
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
            .post('/api/v1/products')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Test Product 2',
              price: 200,
              description: 'Test product description 2',
              category: categoryId,
              quantity: 5,
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
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: categoryId,
                quantity: 5,
                imageCover: 'Test Image Cover',
              });

            expect(response.status).toBe(201);
            expect(response.body.data.doc).toHaveProperty(
              'name',
              'Test Product 2',
            );
            expect(response.body.data.doc).toHaveProperty('price', 200);
          });
        });

        describe('with missing name', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                price: 200,
                description: 'Test product description 2',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Product name is required');
          });
        });

        describe('with missing quantiy', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product quantity is required',
            );
          });
        });

        describe('with missing price', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                description: 'Test product description 2',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product price is required',
            );
          });
        });

        describe('with missing description', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product description is required',
            );
          });
        });

        describe('with missing category', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Product must belong to a category',
            );
          });
        });

        describe('with invalid category', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: 'invalidCategoryId',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'Invalid category ID format',
            );
          });
        });

        describe('with non exsiting category', () => {
          test('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/products')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'Test Product 2',
                price: 200,
                description: 'Test product description 2',
                category: '646f3b0c4d5e8a3d4c8b4567',
                quantity: 5,
                imageCover: 'Test Image Cover',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain(
              'No category for this id: 646f3b0c4d5e8a3d4c8b4567',
            );
          });
        });
      });
    });
  });

  describe('/api/v1/products/:id', () => {
    describe('GET', () => {
      describe('with valid id', () => {
        test('should return a single product', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app).get(
            `/api/v1/products/${newProduct._id}`,
          );
          expect(response.status).toBe(200);
          expect(response.body.data.doc).toHaveProperty('name', 'Test Product');
        });
      });
      describe('with invalid id', () => {
        test('should return 400 Bad Request', async () => {
          const response = await supertest(app).get(
            '/api/v1/products/invalidId',
          );
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid product ID format');
        });
      });
      describe('with non-existing id', () => {
        test('should return 404 Not Found', async () => {
          const response = await supertest(app).get(
            '/api/v1/products/646f3b0c4d5e8a3d4c8b4567',
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
        test('should update the product', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app)
            .patch(`/api/v1/products/${newProduct._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          console.log(response.body);
          expect(response.status).toBe(200);
          expect(response.body.data.doc).toHaveProperty(
            'name',
            'Updated Product',
          );
          expect(response.body.data.doc).toHaveProperty('price', 300);
          expect(response.body.data.doc).toHaveProperty(
            'description',
            'Updated product description',
          );

          expect(response.body.data.doc).toHaveProperty('quantity', 10);
        });
      });

      describe('with invalid id', () => {
        test('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch('/api/v1/products/invalidId')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid product ID format');
        });
      });

      describe('with non-existing id', () => {
        test('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .patch('/api/v1/products/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          expect(response.status).toBe(404);
          expect(response.body.message).toBe('No document found with this ID');
        });
      });

      describe('with invalid category', () => {
        test('should return 400 Bad Request', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app)
            .patch(`/api/v1/products/${newProduct._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: 'invalidCategoryId',
              quantity: 10,
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toContain('Invalid category ID format');
        });
      });

      describe('with non-existing category', () => {
        test('should return 400 Bad Request', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app)
            .patch(`/api/v1/products/${newProduct._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: '646f3b0c4d5e8a3d4c8b4567',
              quantity: 10,
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toContain('No category for this id');
        });
      });

      describe('with regular user token', () => {
        test('should return 403 Forbidden', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app)
            .patch(`/api/v1/products/${newProduct._id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
            });
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        test('should return 401 Unauthorized', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app)
            .patch(`/api/v1/products/${newProduct._id}`)
            .send({
              name: 'Updated Product',
              price: 300,
              description: 'Updated product description',
              category: categoryId,
              quantity: 10,
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
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app)
            .delete(`/api/v1/products/${newProduct._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(204);
        });
      });

      describe('with invalid id', () => {
        test('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .delete('/api/v1/products/invalidId')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid product ID format');
        });
      });

      describe('with non-existing id', () => {
        test('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .delete('/api/v1/products/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(404);
          expect(response.body.message).toBe('No document found with this ID');
        });
      });

      describe('with regular user token', () => {
        test('should return 403 Forbidden', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app)
            .delete(`/api/v1/products/${newProduct._id}`)
            .set('Authorization', `Bearer ${userToken}`);
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        test('should return 401 Unauthorized', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app).delete(
            `/api/v1/products/${newProduct._id}`,
          );
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });
    });
  });

  describe('get /api/v1/products/search', () => {
    describe('with valid search text', () => {
      test('should return an array of products', async () => {
        const newProduct = await createProduct(categoryId);
        const response = await supertest(app)
          .get('/api/v1/products/search')
          .send({ text: 'Test' });
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.products)).toBeTruthy();
      });
    });

    describe('with empty search text', () => {
      test('should return 400 Bad Request', async () => {
        const response = await supertest(app)
          .get('/api/v1/products/search')
          .send({ text: '' });
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Search text is required');
      });
    });
  });

  describe('get /api/v1/products/:id/reviews', () => {
    describe('Get', () => {
      test('should return 200 OK', async () => {
        const newProduct = await createProduct(categoryId);
        const response = await supertest(app).get(
          `/api/v1/products/${newProduct._id}/reviews`,
        );
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(Array.isArray(response.body.data.documents)).toBeTruthy();
      });
    });
    describe('with invalid id', () => {
      test('should return 400 Bad Request', async () => {
        const response = await supertest(app).get(
          '/api/v1/products/invalidId/reviews',
        );
        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Invalid product ID format');
      });
    });

    describe('with non-existing id', () => {
      test('should return 404 Not Found', async () => {
        const response = await supertest(app).get(
          '/api/v1/products/66cc5aa7be03da97c6b0757d/reviews',
        );
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch('No product found with this Id');
      });
    });
  });
  describe('post /api/v1/products/:id/reviews', () => {
    describe('Post', () => {
      describe('with user token', () => {
        test('should return 201 Created', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app)
            .post(`/api/v1/products/${newProduct._id}/reviews`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              title: 'Great product!',
              ratings: 4.5,
            });

          expect(response.status).toBe(201);
          expect(response.body.status).toBe('success');
          expect(response.body.data.doc.title).toBe('Great product!');
          expect(response.body.data.doc.ratings).toBe(4.5);
          expect(response.body.data.doc.product.toString()).toBe(
            newProduct._id.toString(),
          );
        });
      });

      describe('with missing token', () => {
        test('should return 401 Unauthorized', async () => {
          const newProduct = await createProduct(categoryId);
          const response = await supertest(app).post(
            `/api/v1/products/${newProduct._id}/reviews`,
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
