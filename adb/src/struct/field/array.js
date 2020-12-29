import { getBackingField, setBackingField } from '../backing-field';
export var Array;
(function (Array) {
    let SubType;
    (function (SubType) {
        SubType[SubType["ArrayBuffer"] = 0] = "ArrayBuffer";
        SubType[SubType["String"] = 1] = "String";
    })(SubType = Array.SubType || (Array.SubType = {}));
    function initialize(object, field, value) {
        switch (field.subType) {
            case SubType.ArrayBuffer:
                Object.defineProperty(object, field.name, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return getBackingField(object, field.name).buffer;
                    },
                    set(buffer) {
                        setBackingField(object, field.name, { buffer });
                    },
                });
                break;
            case SubType.String:
                Object.defineProperty(object, field.name, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return getBackingField(object, field.name).string;
                    },
                    set(string) {
                        setBackingField(object, field.name, { string });
                    },
                });
                break;
            default:
                throw new Error('Unknown type');
        }
        setBackingField(object, field.name, value);
    }
    Array.initialize = initialize;
})(Array || (Array = {}));
//# sourceMappingURL=array.js.map