const registry = {};
export function getFieldTypeDefinition(type) {
    return registry[type];
}
export function registerFieldTypeDefinition(_field, _initExtra, methods) {
    registry[methods.type] = methods;
}
//# sourceMappingURL=definition.js.map