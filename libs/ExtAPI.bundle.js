var ExtAPI;
(function (ExtAPI) {
    var Permissions;
    (function (Permissions) {
        var _whitelist = [];
        var _blacklist = [];
        function check(request, endpoint) {
            if (isSelf(request.sender.id) || (isWhitelisted(request.sender.id) && isPublic(endpoint))) {
                return Promise.resolve(true);
            }
            if (isBlacklisted(request.sender.id)) {
                return Promise.reject(false);
            }
            return Promise.resolve(true);
        }
        Permissions.check = check;
        function whitelist(ids) {
            if (!ids) {
                return _whitelist.slice(0);
            }
            _whitelist = ids.slice(0);
        }
        Permissions.whitelist = whitelist;
        function blacklist(ids) {
            if (!ids) {
                return _blacklist.slice(0);
            }
            _blacklist = ids.slice(0);
        }
        Permissions.blacklist = blacklist;
        function isSelf(senderId) {
            return !senderId || senderId == ExtAPI.Runtime.id();
        }
        function isWhitelisted(senderId) {
            return _whitelist.indexOf(senderId) > -1;
        }
        function isBlacklisted(senderId) {
            return _blacklist.indexOf(senderId) > -1;
        }
        function isPublic(endpoint) {
            return endpoint.visibility == ExtAPI.Router.EndpointVisibility.Public;
        }
    })(Permissions = ExtAPI.Permissions || (ExtAPI.Permissions = {}));
})(ExtAPI || (ExtAPI = {}));
var ExtAPI;
(function (ExtAPI) {
    var Router;
    (function (Router) {
        var endpoints = {};
        function registerEndpoint(endpoint) {
            if (!endpoint.visibility) {
                endpoint.visibility = EndpointVisibility.Private;
            }
            endpoints[endpoint.action] = endpoint;
        }
        Router.registerEndpoint = registerEndpoint;
        function unregisterEndpoint(action) {
            endpoints[action] = null;
            delete endpoints[action];
        }
        Router.unregisterEndpoint = unregisterEndpoint;
        function dispatch(request) {
            var endpoint;
            return routeRequest(request)
                .then(function (found) {
                endpoint = found;
                return ExtAPI.Permissions.check(request, endpoint);
            })
                .then(function (status) {
                return endpoint.handler(request.parameters, request.sender);
            })
                .then(dispatchResponse)
                .catch(dispatchError);
        }
        Router.dispatch = dispatch;
        function routeRequest(request) {
            var endpoint = endpoints[request.action];
            if (endpoint) {
                return Promise.resolve(endpoint);
            }
            else {
                return Promise.reject(DispatchError.ActionNotFound);
            }
        }
        Router.routeRequest = routeRequest;
        function dispatchError(error) {
            return {
                error: error,
                data: null
            };
        }
        Router.dispatchError = dispatchError;
        function dispatchResponse(result) {
            return {
                error: DispatchError.None,
                data: result
            };
        }
        Router.dispatchResponse = dispatchResponse;
        (function (EndpointVisibility) {
            EndpointVisibility[EndpointVisibility["Private"] = 0] = "Private";
            EndpointVisibility[EndpointVisibility["Public"] = 1] = "Public";
        })(Router.EndpointVisibility || (Router.EndpointVisibility = {}));
        var EndpointVisibility = Router.EndpointVisibility;
        (function (DispatchError) {
            DispatchError[DispatchError["None"] = 0] = "None";
            DispatchError[DispatchError["ActionNotFound"] = 1] = "ActionNotFound";
            DispatchError[DispatchError["TargetNotFound"] = 2] = "TargetNotFound";
            DispatchError[DispatchError["AccessDenied"] = 3] = "AccessDenied";
        })(Router.DispatchError || (Router.DispatchError = {}));
        var DispatchError = Router.DispatchError;
    })(Router = ExtAPI.Router || (ExtAPI.Router = {}));
})(ExtAPI || (ExtAPI = {}));
var ExtAPI;
(function (ExtAPI) {
    var Runtime;
    (function (Runtime) {
        var Adapters;
        (function (Adapters) {
            var Chrome;
            (function (Chrome) {
                var requestHandler;
                function id() {
                    return chrome.runtime.id;
                }
                Chrome.id = id;
                function sendRequest(request) {
                    return new Promise(function (resolve, reject) {
                        chrome.runtime.sendMessage(request.targetId || null, request, function (answer) {
                            if (chrome.runtime.lastError) {
                                reject(ExtAPI.Router.DispatchError.TargetNotFound);
                            }
                            else {
                                resolve(answer);
                            }
                        });
                    });
                }
                Chrome.sendRequest = sendRequest;
                function removeHandler() {
                    if (requestHandler) {
                        chrome.runtime.onMessage.removeListener(requestHandler);
                        chrome.runtime.onMessageExternal.removeListener(requestHandler);
                    }
                }
                Chrome.removeHandler = removeHandler;
                function setHandler(handler) {
                    requestHandler = function (request, sender, sendResponse) {
                        request.sender = sender;
                        handler && handler(request).then(function (response) {
                            try {
                                sendResponse(response);
                            }
                            catch (ex) { }
                        });
                        return true;
                    };
                    chrome.runtime.onMessage.addListener(requestHandler);
                    chrome.runtime.onMessageExternal.addListener(requestHandler);
                }
                Chrome.setHandler = setHandler;
            })(Chrome = Adapters.Chrome || (Adapters.Chrome = {}));
        })(Adapters = Runtime.Adapters || (Runtime.Adapters = {}));
    })(Runtime = ExtAPI.Runtime || (ExtAPI.Runtime = {}));
})(ExtAPI || (ExtAPI = {}));
ExtAPI.Runtime.Adapters.Chrome;
var ExtAPI;
(function (ExtAPI) {
    var Runtime;
    (function (Runtime) {
        var adapter;
        adapter = _autodetect();
        function id() {
            return adapter.id();
        }
        Runtime.id = id;
        function init(config) {
            if (adapter) {
                adapter.removeHandler();
            }
            if (config.adapter) {
                adapter = config.adapter;
            }
            if (!adapter) {
                adapter = _autodetect();
            }
            adapter.setHandler(config.handler);
        }
        Runtime.init = init;
        function send(request) {
            return adapter.sendRequest(request).catch(ExtAPI.Router.dispatchError);
        }
        Runtime.send = send;
        function _autodetect() {
            return Runtime.Adapters.Chrome;
        }
    })(Runtime = ExtAPI.Runtime || (ExtAPI.Runtime = {}));
})(ExtAPI || (ExtAPI = {}));
var ExtAPI;
(function (ExtAPI) {
    function init() {
        ExtAPI.Runtime.init({ handler: ExtAPI.Router.dispatch });
    }
    ExtAPI.init = init;
    function register(endpoint) {
        ExtAPI.Router.registerEndpoint(endpoint);
    }
    ExtAPI.register = register;
    function unregister(action) {
        ExtAPI.Router.unregisterEndpoint(action);
    }
    ExtAPI.unregister = unregister;
    function invoke(action, parameters, targetId) {
        var request = {
            action: action,
            parameters: parameters,
            targetId: targetId
        };
        return ExtAPI.Runtime.send(request).then(parseResponse);
    }
    ExtAPI.invoke = invoke;
    function parseResponse(response) {
        if (response.error != ExtAPI.Router.DispatchError.None) {
            return Promise.reject(response.error);
        }
        else {
            return Promise.resolve(response.data);
        }
    }
})(ExtAPI || (ExtAPI = {}));
//# sourceMappingURL=ExtAPI.bundle.js.map