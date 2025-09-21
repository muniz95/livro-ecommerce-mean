'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var slug = require('mongoose-slug-updater');

mongoose.plugin(slug);

var CatalogSchema = new Schema({
  name: { type: String, required: true},
  parent: { type: Schema.Types.ObjectId, ref: 'Catalog' },
  ancestors: [{ type: Schema.Types.ObjectId, ref: 'Catalog' }],
  children: [{ type: Schema.Types.ObjectId, ref: 'Catalog' }],
  slug: {
    type: String,
    slug: 'name',
    unique: true
  }
});

CatalogSchema.methods = {
  addChild: function (child) {
    var that = this;
    child.parent = this._id;
    child.ancestors = this.ancestors.concat([this._id]);
    return this.model('Catalog').create(child).then(function (child) {
      that.children.push(child._id);
      return that.save().then(function() {
        return child;
      });
    });
  }
}

module.exports = mongoose.model('Catalog', CatalogSchema);
