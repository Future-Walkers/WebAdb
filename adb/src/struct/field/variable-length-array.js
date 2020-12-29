import { getBackingField, setBackingField } from '../backing-field';
import { placeholder } from '../utils';
import { Array } from './array';
import { registerFieldTypeDefinition } from './definition';
import { FieldType } from './descriptor';
export var VariableLengthArray;
(function (VariableLengthArray) {
    let EmptyBehavior;
    (function (EmptyBehavior) {
        EmptyBehavior[EmptyBehavior["Undefined"] = 0] = "Undefined";
        EmptyBehavior[EmptyBehavior["Empty"] = 1] = "Empty";
    })(EmptyBehavior = VariableLengthArray.EmptyBehavior || (VariableLengthArray.EmptyBehavior = {}));
    function getLengthBackingField(object, field) {
        return getBackingField(object, field.options.lengthField);
    }
    VariableLengthArray.getLengthBackingField = getLengthBackingField;
    function setLengthBackingField(object, field, value) {
        setBackingField(object, field.options.lengthField, value);
    }
    VariableLengthArray.setLengthBackingField = setLengthBackingField;
    function initialize(object, field, value, context) {
        Array.initialize(object, field, value);
        const descriptor = Object.getOwnPropertyDescriptor(object, field.name);
        delete object[field.name];
        switch (field.subType) {
            case Array.SubType.ArrayBuffer:
                Object.defineProperty(object, field.name, {
                    ...descriptor,
                    set(buffer) {
                        var _a;
                        descriptor.set.call(object, buffer);
                        setLengthBackingField(object, field, (_a = buffer === null || buffer === void 0 ? void 0 : buffer.byteLength) !== null && _a !== void 0 ? _a : 0);
                    },
                });
                delete object[field.options.lengthField];
                Object.defineProperty(object, field.options.lengthField, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return getLengthBackingField(object, field);
                    }
                });
                break;
            case Array.SubType.String:
                Object.defineProperty(object, field.name, {
                    ...descriptor,
                    set(string) {
                        descriptor.set.call(object, string);
                        if (string) {
                            setLengthBackingField(object, field, undefined);
                        }
                        else {
                            setLengthBackingField(object, field, 0);
                        }
                    },
                });
                delete object[field.options.lengthField];
                Object.defineProperty(object, field.options.lengthField, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        let value = getLengthBackingField(object, field);
                        if (value === undefined) {
                            const backingField = getBackingField(object, field.name);
                            const buffer = context.encodeUtf8(backingField.string);
                            backingField.buffer = buffer;
                            value = buffer.byteLength;
                            setLengthBackingField(object, field, value);
                        }
                        return value;
                    }
                });
                break;
            default:
                throw new Error('Unknown type');
        }
        setBackingField(object, field.name, value);
        if (value.buffer) {
            setLengthBackingField(object, field, value.buffer.byteLength);
        }
    }
    VariableLengthArray.initialize = initialize;
})(VariableLengthArray || (VariableLengthArray = {}));
registerFieldTypeDefinition(placeholder(), placeholder(), {
    type: FieldType.VariableLengthArray,
    async deserialize({ context, field, object }) {
        let length = object[field.options.lengthField];
        if (typeof length === 'string') {
            length = Number.parseInt(length, 10);
        }
        if (length === 0) {
            if (field.options.emptyBehavior === VariableLengthArray.EmptyBehavior.Empty) {
                switch (field.subType) {
                    case Array.SubType.ArrayBuffer:
                        return { value: new ArrayBuffer(0) };
                    case Array.SubType.String:
                        return { value: '', extra: new ArrayBuffer(0) };
                    default:
                        throw new Error('Unknown type');
                }
            }
            else {
                return { value: undefined };
            }
        }
        const buffer = await context.read(length);
        switch (field.subType) {
            case Array.SubType.ArrayBuffer:
                return { value: buffer };
            case Array.SubType.String:
                return {
                    value: context.decodeUtf8(buffer),
                    extra: buffer
                };
            default:
                throw new Error('Unknown type');
        }
    },
    getSize() { return 0; },
    getDynamicSize({ field, object }) {
        return object[field.options.lengthField];
    },
    initialize({ context, extra, field, object, value }) {
        const backingField = {};
        if (typeof value === 'string') {
            backingField.string = value;
            if (extra) {
                backingField.buffer = extra;
            }
        }
        else {
            backingField.buffer = value;
        }
        Array.initialize(object, field, backingField);
        VariableLengthArray.initialize(object, field, backingField, context);
    },
    serialize({ dataView, field, object, offset }) {
        const backingField = getBackingField(object, field.name);
        new Uint8Array(dataView.buffer).set(new Uint8Array(backingField.buffer), offset);
    },
});
//# sourceMappingURL=variable-length-array.js.map