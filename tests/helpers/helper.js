const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Product = require('../../src/models/productModel');
const User = require('../../src/models/userModel');
const Category = require('../../src/models/categoryModel');
const Brand = require('../../src/models/brandModel');
const SubCategory = require('../../src/models/subCategoryModel');

dotenv.config();
