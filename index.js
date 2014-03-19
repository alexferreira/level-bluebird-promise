var _         = require('lodash')
  , Promise   = require('bluebird')
  , Manifest  = require('level-manifest')
  , level     = require('level')
  , sublevel  = require('level-sublevel');

module.exports = function (db) {
  var db = sublevel(level(db))
    , manifest = new Manifest(db);
  return _resursive(db, manifest);
};

function _resursive(db, manifest){
  _.chain(manifest.methods).pick(function(obj){
    return obj.type == 'async';
  }).each(function(v, k){
    return db[k] = Promise.promisify(db[k]);
  }).value();

  var sublevels = manifest.sublevels || {};
  for (var name in sublevels) if (_.has(sublevels, name)){
    _resursive(db.sublevels[name], sublevels[name]);
  }

  if (_.isFunction(db.sublevel)) {
    var Sub = db.sublevel;
    db.sublevel = function(name) {
      var sublevel = Sub.apply(this, arguments);
      if (!_.has(sublevels, name)) _resursive(sublevel, new Manifest(sublevel));
      return sublevel;
    }
  }
  return db;
};