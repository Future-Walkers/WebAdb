import { placeholder } from '../utils';
import { registerFieldTypeDefinition } from './definition';
import { FieldType } from './descriptor';
export var Number;
(function (Number) {
    let SubType;
    (function (SubType) {
        SubType[SubType["Uint8"] = 0] = "Uint8";
        SubType[SubType["Uint16"] = 1] = "Uint16";
        SubType[SubType["Int32"] = 2] = "Int32";
        SubType[SubType["Uint32"] = 3] = "Uint32";
        SubType[SubType["Uint64"] = 4] = "Uint64";
        SubType[SubType["Int64"] = 5] = "Int64";
    })(SubType = Number.SubType || (Number.SubType = {}));
    Number.SizeMap = {
        [SubType.Uint8]: 1,
        [SubType.Uint16]: 2,
        [SubType.Int32]: 4,
        [SubType.Uint32]: 4,
        [SubType.Uint64]: 8,
        [SubType.Int64]: 8,
    };
    Number.DataViewGetterMap = {
        [SubType.Uint8]: 'getUint8',
        [SubType.Uint16]: 'getUint16',
        [SubType.Int32]: 'getInt32',
        [SubType.Uint32]: 'getUint32',
        [SubType.Uint64]: 'getBigUint64',
        [SubType.Int64]: 'getBigInt64',
    };
    Number.DataViewSetterMap = {
        [SubType.Uint8]: 'setUint8',
        [SubType.Uint16]: 'setUint16',
        [SubType.Int32]: 'setInt32',
        [SubType.Uint32]: 'setUint32',
        [SubType.Uint64]: 'setBigUint64',
        [SubType.Int64]: 'setBigInt64',
    };
})(Number || (Number = {}));
registerFieldTypeDefinition(placeholder(), undefined, {
    type: FieldType.Number,
    getSize({ field }) {
        return Number.SizeMap[field.subType];
    },
    async deserialize({ context, field, options }) {
        const buffer = await context.read(Number.SizeMap[field.subType]);
        const view = new DataView(buffer);
        const value = view[Number.DataViewGetterMap[field.subType]](0, options.littleEndian);
        return { value };
    },
    serialize({ dataView, field, object, offset, options }) {
        dataView[Number.DataViewSetterMap[field.subType]](offset, object[field.name], options.littleEndian);
    },
});
//# sourceMappingURL=number.js.map