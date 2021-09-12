"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultSerializer = void 0;
var DefaultSerializer = /** @class */ (function () {
    function DefaultSerializer() {
        var _this = this;
        this.typeInfoKey = '$$cacheable.$$objectType';
        this.dataKey = '$$cacheable.$$object';
        this.supportedTypes = [Map, Set];
        this.type2name = new Map([[Map, 'map'], [Set, 'set']]);
        this.name2converter = new Map([
            ['map', function (obj) {
                    return new Map(obj);
                }],
            ['set', function (obj) {
                    return new Set(obj);
                }]
        ]);
        this.replacer = function (key, value) {
            var _a;
            var type = typeof (value);
            if (type !== 'object')
                return value;
            var matchedType = _this.supportedTypes.find(function (type) { return value instanceof type; });
            if (matchedType) {
                if (value.hasOwnProperty(_this.typeInfoKey))
                    throw Error("Reserved key " + _this.typeInfoKey + " was used in " + key + "->" + value + "!");
                return _a = {},
                    _a[_this.typeInfoKey] = _this.type2name.get(matchedType),
                    _a[_this.dataKey] = __spreadArray([], __read(value), false),
                    _a;
            }
            else {
                return value;
            }
        };
        this.reviver = function (key, value) {
            var type = typeof value;
            var typeInfo = value[_this.typeInfoKey];
            if (type !== 'object' || !_this.name2converter.has(typeInfo))
                return value;
            var data = value[_this.dataKey];
            var converter = _this.name2converter.get(typeInfo);
            return converter(data);
        };
    }
    DefaultSerializer.prototype.serialize = function (obj) {
        return JSON.stringify(obj, this.replacer);
    };
    DefaultSerializer.prototype.deserialize = function (value) {
        return JSON.parse(value, this.reviver);
    };
    return DefaultSerializer;
}());
exports.DefaultSerializer = DefaultSerializer;
//# sourceMappingURL=serializer.js.map