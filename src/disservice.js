/*
 * Disservice, lightweight service container for javascript
 * Author: Ben Glassman <ben@vtdesignworks.com>
 */
(function ( name, definition ){
  var theModule = definition(),
      // this is considered "safe":
      hasDefine = typeof define === "function" && define.amd,
      // hasDefine = typeof define === "function",
      hasExports = typeof module !== "undefined" && module.exports;

  if ( hasDefine ){ // AMD Module
    define(theModule);
  } else if ( hasExports ) { // Node.js Module
    module.exports = theModule;
  } else { // Assign to common namespaces or simply the global object (window)
    (this.jQuery || this.ender || this.$ || this)[name] = theModule;
  }
})("Disservice", function () {

    var d = function(serviceProviders, params) {

        // Disservice
        var _ds = this;

        // Hash of callables which provider an instance of a service
        var _serviceProviders = serviceProviders || {};

        // Hash of service instances
        var _services = {};

        // Hash of parameters
        var _params = params || {};

        // Determine if a provider for a service is available
        var _providerExists = function(name) {
            return name in _serviceProviders;
        };

        // Determine if service instance exists
        var _serviceExists = function(name) {
            return name in _services;
        };

        // Create a new service from a provider
        var _createService = function(name) {
            if (!_providerExists(name)) throw 'Provider not found for service: ' + name;
            return _services[name] = _serviceProviders[name].apply(_ds);
        };

        // Check if a variable is a function, from underscore.js
        var _isFunction = function(arg) {
            return !!(arg && arg.constructor && arg.call && arg.apply)
        };

        // Add a new service provider
        this.add = function(name, service) {
            if (_providerExists(name)) throw 'Service already exists with name: ' + name;
            _serviceProviders[name] = service;
            return this;
        };

        // Get a service
        this.get = function(name) {
            return _serviceExists(name) ? _services[name] : _createService(name);
        };

        // Set a parameter
        this.setParameter = function(key, value) {
            _params[key] = value;
            return this;
        };

        // Get a parameter
        this.getParameter = function(key) {
            if (!(key in _params)) throw 'Invalid parameter ' + key;

            // If the parameter is a function, use it to lazy load it to a scalar value
            if (_isFunction(_params[key])) {
                this.setParameter(key, _params[key].apply(this));
            }

            return _params[key];
        };
    };

    return d;

});
