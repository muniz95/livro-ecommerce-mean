'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Updated Babel register for modern Babel
require('@babel/register')({
  presets: ['@babel/preset-env']
});

// Start up the server
require('./app');
