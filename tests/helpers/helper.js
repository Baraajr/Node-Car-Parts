const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Product = require('../../src/models/productModel');
const User = require('../../src/models/userModel');
const Category = require('../../src/models/categoryModel');
const Brand = require('../../src/models/brandModel');
const SubCategory = require('../../src/models/subCategoryModel');

dotenv.config();

exports.createAdminUser = async () => {
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'test1234',
    role: 'admin',
  });

  return admin;
};

exports.createReqularUser = async (options) => {
  if (options) {
    const user = await User.create({
      name: options.name,
      email: options.email,
      password: options.password,
      passwordConfirm: options.passwordConfirm,
    });
    return user;
  }
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'test1234',
  });

  return user;
};

exports.createJWTToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

exports.createCategory = async () => {
  const category = await Category.create({
    name: 'Test Category',
  });
  return category;
};

exports.createSubCategory = async (categoryId) => {
  const subCategory = await SubCategory.create({
    name: 'test subCategory',
    category: categoryId,
  });
  return subCategory;
};

exports.createBrand = async () => {
  const brand = await Brand.create({
    name: 'test brand',
  });
  return brand;
};

// eslint-disable-next-line no-shadow
exports.createProduct = async (categoryId) => {
  const product = await Product.create({
    name: 'Test Product',
    price: 100,
    description: 'Test product description',
    category: categoryId,
    color: 'Test Color',
    quantity: 10,
    imageCover: 'test-cover.jpg',
  });

  return product;
};

exports.deleteAllProducts = async () => {
  await Product.deleteMany({});
};

exports.deleteAllCategories = async () => {
  await Category.deleteMany({});
};

exports.deleteAllBrands = async () => {
  await Brand.deleteMany({});
};

exports.deleteAllSubCategories = async () => {
  await SubCategory.deleteMany({});
};

exports.deleteAllUsers = async () => {
  await User.deleteMany({});
};
