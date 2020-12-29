import { BackingField, defineSimpleAccessors, setBackingField } from './backing-field';
import { Array, FieldType, getFieldTypeDefinition, Number } from './field/index';
import { StructDefaultOptions } from './types';
export default class Struct {
    constructor(options = StructDefaultOptions) {
        this._size = 0;
        this.fields = [];
        this._extra = {};
        this.array = (name, type, options) => {
            if ('length' in options) {
                return this.field({
                    type: FieldType.FixedLengthArray,
                    name,
                    subType: type,
                    options: options,
                });
            }
            else {
                return this.field({
                    type: FieldType.VariableLengthArray,
                    name,
                    subType: type,
                    options: options,
                });
            }
        };
        this.arrayBuffer = (name, options) => {
            return this.array(name, Array.SubType.ArrayBuffer, options);
        };
        this.string = (name, options) => {
            return this.array(name, Array.SubType.String, options);
        };
        this.options = { ...StructDefaultOptions, ...options };
    }
    get size() { return this._size; }
    clone() {
        const result = new Struct(this.options);
        result.fields = this.fields.slice();
        result._size = this._size;
        result._extra = this._extra;
        result._afterParsed = this._afterParsed;
        return result;
    }
    field(field) {
        const result = this.clone();
        result.fields.push(field);
        const definition = getFieldTypeDefinition(field.type);
        const size = definition.getSize({ field, options: this.options });
        result._size += size;
        return result;
    }
    number(name, type, options = {}, _typescriptType) {
        return this.field({
            type: FieldType.Number,
            name,
            subType: type,
            options,
        });
    }
    uint8(name, options = {}, _typescriptType) {
        return this.number(name, Number.SubType.Uint8, options, _typescriptType);
    }
    uint16(name, options = {}, _typescriptType) {
        return this.number(name, Number.SubType.Uint16, options, _typescriptType);
    }
    int32(name, options = {}, _typescriptType) {
        return this.number(name, Number.SubType.Int32, options, _typescriptType);
    }
    uint32(name, options = {}, _typescriptType) {
        return this.number(name, Number.SubType.Uint32, options, _typescriptType);
    }
    uint64(name, options = {}, _typescriptType) {
        return this.number(name, Number.SubType.Uint64, options, _typescriptType);
    }
    int64(name, options = {}, _typescriptType) {
        return this.number(name, Number.SubType.Int64, options, _typescriptType);
    }
    extra(value) {
        const result = this.clone();
        result._extra = { ...result._extra, ...Object.getOwnPropertyDescriptors(value) };
        return result;
    }
    afterParsed(callback) {
        const result = this.clone();
        result._afterParsed = callback;
        return result;
    }
    initializeField(context, field, fieldTypeDefinition, object, value, extra) {
        if (fieldTypeDefinition.initialize) {
            fieldTypeDefinition.initialize({
                context,
                extra,
                field,
                object,
                options: this.options,
                value,
            });
        }
        else {
            setBackingField(object, field.name, value);
            defineSimpleAccessors(object, field.name);
        }
    }
    create(init, context) {
        const object = {
            [BackingField]: {},
        };
        Object.defineProperties(object, this._extra);
        for (const field of this.fields) {
            const fieldTypeDefinition = getFieldTypeDefinition(field.type);
            this.initializeField(context, field, fieldTypeDefinition, object, init[field.name]);
        }
        return object;
    }
    async deserialize(context) {
        const object = {
            [BackingField]: {},
        };
        Object.defineProperties(object, this._extra);
        for (const field of this.fields) {
            const fieldTypeDefinition = getFieldTypeDefinition(field.type);
            const { value, extra } = await fieldTypeDefinition.deserialize({
                context,
                field,
                object,
                options: this.options,
            });
            this.initializeField(context, field, fieldTypeDefinition, object, value, extra);
        }
        if (this._afterParsed) {
            const result = this._afterParsed.call(object, object);
            if (result) {
                return result;
            }
        }
        return object;
    }
    serialize(init, context) {
        const object = this.create(init, context);
        let size = this._size;
        let fieldSize = [];
        for (let i = 0; i < this.fields.length; i += 1) {
            const field = this.fields[i];
            const type = getFieldTypeDefinition(field.type);
            if (type.getDynamicSize) {
                fieldSize[i] = type.getDynamicSize({
                    context,
                    field,
                    object,
                    options: this.options,
                });
                size += fieldSize[i];
            }
            else {
                fieldSize[i] = type.getSize({ field, options: this.options });
            }
        }
        const buffer = new ArrayBuffer(size);
        const dataView = new DataView(buffer);
        let offset = 0;
        for (let i = 0; i < this.fields.length; i += 1) {
            const field = this.fields[i];
            const type = getFieldTypeDefinition(field.type);
            type.serialize({
                context,
                dataView,
                field,
                object,
                offset,
                options: this.options,
            });
            offset += fieldSize[i];
        }
        return buffer;
    }
}
//# sourceMappingURL=struct.js.map