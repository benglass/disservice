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

    // Check if a variable is a function, from underscore.js
    var isFunction = function(arg) {
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
        } else if (Array.isArray(fn)) {
            last = fn.length - 1;
            $inject = fn.slice(0, last);
        }
        return $inject;
    };

    var Disservice = function(serviceProviders, params) {

        // Hash of callables which provider an instance of a service
        this.serviceProviders = serviceProviders || {};

        // Hash of service instances
        this.services = {};
        this.aliases = {};

        // Hash of parameters
        this.params = params || {};

    };

    Disservice.prototype = {
        // Determine if a provider for a service is available
        providerExists: function(name) {
            return name in this.serviceProviders;
        },

        // Determine if service instance exists
        serviceExists: function(name) {
            return name in this.services;
        },

        // Create a new service from a provider
        createService: function(name) {
            if (!this.providerExists(name)) throw new Error('Provider not found for service: ' + name);
            return this.services[name] = this.serviceProviders[name].apply(this);
        },

        // Add a new service provider
        add: function(name, service) {
            if (this.providerExists(name)) throw new Error('Service already exists with name: ' + name);
            this.serviceProviders[name] = service;
            return this;
        },

        // Create an alias for a service
        alias: function(alias, name) {
            return this.aliases[alias] = name;
        },

        // Resolve a service name, checking for aliases
        resolveName: function(name) {
            return name in this.aliases ? this.aliases[name] : name;
        },

        // Check if a service exists
        has: function(name) {
            name = this.resolveName(name)
            return this.serviceExists(name) || this.providerExists(name);
        },

        // Get a service
        get: function(name) {
            name = this.resolveName(name)
            return this.serviceExists(name) ? this.services[name] : this.createService(name);
        },

        // Set a parameter
        setParameter: function(key, value) {
            this.params[key] = value;
            return this;
        },

        // Get a parameter
        getParameter: function(key) {
            if (!this.hasParameter(key)) throw new Error('Invalid parameter ' + key);

            // If the parameter is a function, use it to lazy load it to a scalar value
            if (isFunction(this.params[key])) {
                this.setParameter(key, this.params[key].apply(this));
            }

            return this.params[key];
        },

        // Check if a service exists
        hasParameter: function(name) {
            return name in this.params;
        },

        // Inject a function with dependencies
        getParameter: function(key) {
            if (!(key in this.params)) throw new Error('Invalid parameter ' + key);

            // If the parameter is a function, use it to lazy load it to a scalar value
            if (isFunction(this.params[key])) {
                this.setParameter(key, this.params[key].apply(this));
            }

            return this.params[key];
        },

        inject: function(fn, defaults) {
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
        }
    };

    return Disservice;

});
