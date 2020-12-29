export const BackingField = Symbol('BackingField');
export function getBackingField(object, field) {
    return object[BackingField][field];
}
export function setBackingField(object, field, value) {
    object[BackingField][field] = value;
}
export function defineSimpleAccessors(object, field) {
    Object.defineProperty(object, field, {
        configurable: true,
        enumerable: true,
        get() { return getBackingField(object, field); },
        set(value) { setBackingField(object, field, value); },
    });
}
//# sourceMappingURL=backing-field.js.map