/*
 * @Author: Sphantix Hang
 * @date: 2020-12-28 17:48:54
 * @last_author: Sphantix Hang
 * @last_edit_time: 2020-12-29 10:13:49
 * @file_path: /webadb/adb/src/async-operation-manager/index.js
 */
export var PromiseResolver = /** @class */ (function () {
    function PromiseResolver() {
        var _this = this;
        this._state = 'running';
        this._promise = new Promise(function (resolve, reject) {
            _this._resolve = resolve;
            _this._reject = reject;
        });
    }
    Object.defineProperty(PromiseResolver.prototype, "promise", {
        get: function () { return this._promise; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PromiseResolver.prototype, "state", {
        get: function () { return this._state; },
        enumerable: false,
        configurable: true
    });
    PromiseResolver.prototype.resolve = function (value) {
        this._resolve(value);
        this._state = 'resolved';
    };
    PromiseResolver.prototype.reject = function (reason) {
        this._reject(reason);
        this._state = 'rejected';
    };
    return PromiseResolver;
}());

export var AsyncOperationManager = /** @class */ (function () {
    function AsyncOperationManager(initialId) {
        if (initialId === void 0) { initialId = 0; }
        this.operations = new Map();
        this.operationId = initialId;
    }
    AsyncOperationManager.prototype.add = function () {
        var id = this.operationId++;
        var resolver = new PromiseResolver();
        this.operations.set(id, resolver);
        return [id, resolver.promise];
    };
    AsyncOperationManager.prototype.getResolver = function (id) {
        if (!this.operations.has(id)) {
            return null;
        }
        var resolver = this.operations.get(id);
        this.operations.delete(id);
        return resolver;
    };
    AsyncOperationManager.prototype.resolve = function (id, result) {
        var resolver = this.getResolver(id);
        if (resolver !== null) {
            resolver.resolve(result);
            return true;
        }
        return false;
    };
    AsyncOperationManager.prototype.reject = function (id, reason) {
        var resolver = this.getResolver(id);
        if (resolver !== null) {
            resolver.reject(reason);
            return true;
        }
        return false;
    };
    return AsyncOperationManager;
}());
//# sourceMappingURL=index.js.map