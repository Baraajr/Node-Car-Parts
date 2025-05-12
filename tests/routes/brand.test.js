/* eslint-disable node/no-unpublished-require */
/* eslint-disable no-undef */
/* eslint-disable import/no-extraneous-dependencies */
const supertest = require('supertest');
const app = require('../../src/app');
const {
  createAdminUser,
  createReqularUser,
  createJWTToken,
  createBrand,
  deleteAllBrands,
  // deleteAllCategories,
} = require('../helpers/helper');

let adminToken;
let userToken;

beforeAll(async () => {
  // create admin and regular user
  const adminUser = await createAdminUser(); // Await user creation
  adminToken = createJWTToken(adminUser._id); // Generate token after user is created
  const regularUser = await createReqularUser(); // Await user creation
  userToken = createJWTToken(regularUser._id); // Generate token after user is created
});

afterEach(async () => {
  // delete all brands after each test
  await deleteAllBrands();
});

describe('Testing brand routes ', () => {
  describe('/api/v1/brands', () => {
    describe('GET', () => {
      it('should return an array of brands', async () => {
        const response = await supertest(app).get('/api/v1/brands');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data.brands)).toBeTruthy();
      });
    });

    describe('POST', () => {
      describe('without a login token', () => {
        it('should return 401 Unauthorized', async () => {
          const response = await supertest(app).post('/api/v1/brands').send({
            name: 'test brand',
          });
          expect(response.status).toBe(401);
          expect(response.body.message).toBe(
            'You are not logged in. Please log in to get access.',
          );
        });
      });

      describe('with regular user token', () => {
        it('Should returns 403 Forbidden', async () => {
          const response = await supertest(app)
            .post('/api/v1/brands')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              name: 'test brand',
            });

          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with Admin token', () => {
        describe('with all required fields', () => {
          it('should Return 201 Created', async () => {
            const response = await supertest(app)
              .post('/api/v1/brands')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'test brand',
              });

            expect(response.status).toBe(201);
            expect(response.body.data.brand).toHaveProperty(
              'name',
              'test brand',
            );
          });
        });

        describe('with missing name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/brands')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Brand name required');
          });
        });

        describe('with short name', () => {
          it('should return 400 Bad Request', async () => {
            const response = await supertest(app)
              .post('/api/v1/brands')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'ab',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Too short Brand name');
          });
        });

        describe('with duplicate name', () => {
          it('should return 400 Bad Request', async () => {
            await createBrand(); // Create a brand first
            const response = await supertest(app)
              .post('/api/v1/brands')
              .set('Authorization', `Bearer ${adminToken}`)
              .send({
                name: 'test brand',
              });
            expect(response.status).toBe(400);
            expect(response.body.message).toMatch(
              /Duplicate field name: 'test brand'./i,
            );
          });
        });
      });
    });
  });

  describe('/api/v1/brands/:id', () => {
    describe('GET', () => {
      describe('with valid id', () => {
        it('should return a single brand', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app).get(
            `/api/v1/brands/${newBrand._id}`,
          );
          expect(response.status).toBe(200);
          expect(response.body.data.brand).toHaveProperty('name', 'test brand');
        });
      });
      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app).get('/api/v1/brands/invalidId');
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid Brand id');
        });
      });
      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app).get(
            '/api/v1/brands/646f3b0c4d5e8a3d4c8b4567',
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
        it('should update the brand', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app)
            .patch(`/api/v1/brands/${newBrand._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated brand',
            });
          expect(response.status).toBe(200);
          expect(response.body.data.brand).toHaveProperty(
            'name',
            'Updated brand',
          );
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .patch('/api/v1/brands/invalidId')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: 'Updated Product',
            });
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid Brand id');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .patch('/api/v1/brands/646f3b0c4d5e8a3d4c8b4567')
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
        it('should return 403 Forbidden', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app)
            .patch(`/api/v1/brands/${newBrand._id}`)
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
        it('should return 401 Unauthorized', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app)
            .patch(`/api/v1/brands/${newBrand._id}`)
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
        it('should delete the brand', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app)
            .delete(`/api/v1/brands/${newBrand._id}`)
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(204);
        });
      });

      describe('with invalid id', () => {
        it('should return 400 Bad Request', async () => {
          const response = await supertest(app)
            .delete('/api/v1/brands/invalidId')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(400);
          expect(response.body.message).toMatch('Invalid Brand id');
        });
      });

      describe('with non-existing id', () => {
        it('should return 404 Not Found', async () => {
          const response = await supertest(app)
            .delete('/api/v1/brands/646f3b0c4d5e8a3d4c8b4567')
            .set('Authorization', `Bearer ${adminToken}`);
          expect(response.status).toBe(404);
          expect(response.body.message).toBe(
            'No document with this ID 646f3b0c4d5e8a3d4c8b4567',
          );
        });
      });

      describe('with regular user token', () => {
        it('should return 403 Forbidden', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app)
            .delete(`/api/v1/brands/${newBrand._id}`)
            .set('Authorization', `Bearer ${userToken}`);
          expect(response.status).toBe(403);
          expect(response.body.message).toBe(
            'you do not have permission to perform this action',
          );
        });
      });

      describe('with missing token', () => {
        it('should return 401 Unauthorized', async () => {
          const newBrand = await createBrand();
          const response = await supertest(app).delete(
            `/api/v1/brands/${newBrand._id}`,
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
