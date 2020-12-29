import { getBackingField } from '../backing-field';
import { placeholder } from '../utils';
import { Array } from './array';
import { registerFieldTypeDefinition } from './definition';
import { FieldType } from './descriptor';
;
registerFieldTypeDefinition(placeholder(), placeholder(), {
    type: FieldType.FixedLengthArray,
    async deserialize({ context, field }) {
        const buffer = await context.read(field.options.length);
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
    getSize({ field }) {
        return field.options.length;
    },
    initialize({ extra, field, object, value }) {
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
    },
    serialize({ context, dataView, field, object, offset }) {
        var _a;
        const backingField = getBackingField(object, field.name);
        (_a = backingField.buffer) !== null && _a !== void 0 ? _a : (backingField.buffer = context.encodeUtf8(backingField.string));
        new Uint8Array(dataView.buffer).set(new Uint8Array(backingField.buffer), offset);
    }
});
//# sourceMappingURL=fixed-length-array.js.map