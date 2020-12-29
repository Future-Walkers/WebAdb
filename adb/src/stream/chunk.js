export function* chunkArrayLike(value, size) {
    if ('length' in value) {
        value = new Uint8Array(value).buffer;
    }
    if (value.byteLength <= size) {
        return yield value;
    }
    for (let i = 0; i < value.byteLength; i += size) {
        yield value.slice(i, i + size);
    }
}
//# sourceMappingURL=chunk.js.map