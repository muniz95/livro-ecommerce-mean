/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/orders', require('./api/order'));
  app.use('/api/products', require('./api/product'));
  app.use('/api/catalogs', require('./api/catalog'));
  app.use('/api/users', require('./api/user'));

  app.use('/auth', require('./auth'));

  // Handle 404s for undefined API/asset routes using regex
  app.get(/^\/(?:api|auth|components|app|bower_components|assets)\/.*/, function(req, res) {
    errors[404](req, res);
  });

  // All other routes should redirect to the index.html
  // Use a regex pattern instead of '*' wildcard
  app.get(/.*/, function(req, res) {
    res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
  });
};
