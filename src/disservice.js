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
        var _aliases = {};

        // Hash of parameters
        var _params = params || {};

        // Determine if a provider for a service is available
        var _providerExists = function(name) {
            return name in _serviceProviders;
        };

        // Determine if service instance exists
        var _serviceExists = function(name) {
            return name in _services || name in _aliases;
        };

        // Get a service by name or alias
        var _get = function(name) {
            name = name in _aliases ? _aliases[name] : name;
            return name in _services ? _services[name] : null;
        };

        // Create a new service from a provider
        var _createService = function(name) {
            if (!_providerExists(name)) throw new Error('Provider not found for service: ' + name);
            return _services[name] = _serviceProviders[name].apply(_ds);
        };

        // Check if a variable is a function, from underscore.js
        var _isFunction = function(arg) {
            return !!(arg && arg.constructor && arg.call && arg.apply)
        };

        /**
         * Function for extracting argument names from a function
         */
        var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
        var FN_ARG_SPLIT = /,/;
        var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
        var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        var annotate = function(fn) {
            var $inject,
            fnText,
            argDecl,
            last;

            if (typeof fn == 'function') {
                if (!($inject = fn.$inject)) {
                    $inject = [];
                    fnText = fn.toString().replace(STRIP_COMMENTS, '');
                    argDecl = fnText.match(FN_ARGS);
                    argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg){
                        arg.replace(FN_ARG, function(all, underscore, name){
                            $inject.push(name);
                        });
                    });
                    fn.$inject = $inject;
                }
            } else if (isArray(fn)) {
                last = fn.length - 1;
                $inject = fn.slice(0, last);
            }
            return $inject;
        }

        // Add a new service provider
        this.add = function(name, service) {
            if (_providerExists(name)) throw new Error('Service already exists with name: ' + name);
            _serviceProviders[name] = service;
            return this;
        };

        // Create an alias for a service
        this.alias = function(alias, name) {
            return _alias[alias] = name;
        };

        // Check if a service exists
        this.has = function(name) {
            return _serviceExists(name) || _providerExists(name);
        };

        // Get a service
        this.get = function(name) {
            return _serviceExists(name) ? _get(name) : _createService(name);
        };

        // Set a parameter
        this.setParameter = function(key, value) {
            _params[key] = value;
            return this;
        };

        // Get a parameter
        this.getParameter = function(key) {
            if (!this.hasParameter(key)) throw new Error('Invalid parameter ' + key);

            // If the parameter is a function, use it to lazy load it to a scalar value
            if (_isFunction(_params[key])) {
                this.setParameter(key, _params[key].apply(this));
            }

            return _params[key];
        };

        // Check if a service exists
        this.hasParameter = function(name) {
            return name in _params;
        };

        // Inject a function with dependencies
        this.getParameter = function(key) {
            if (!(key in _params)) throw new Error('Invalid parameter ' + key);

            // If the parameter is a function, use it to lazy load it to a scalar value
            if (_isFunction(_params[key])) {
                this.setParameter(key, _params[key].apply(this));
            }

            return _params[key];
        };

        this.inject = function(fn, defaults) {
            var args = [],
                diArgs = annotate(fn),
                defaults = defaults || {},
                arg;
            for (x in diArgs) {
                arg = diArgs[x];
                if (arg in defaults) {
                    args.push(defaults[arg]);
                } else if (this.has(arg)) {
                    args.push(this.get(arg));
                } else if (this.hasParameter(arg)) {
                    args.push(this.getParameter(arg));
                } else {
                    throw new Error('Could not find service or parameter named ' + arg);
                }
            }
            return fn.apply(fn, args);
        };
    };

    return d;

});
