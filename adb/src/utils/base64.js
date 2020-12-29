// Prepare maps for O(1) searching
const charToIndex = {};
const indexToChar = [];
const paddingChar = '='.charCodeAt(0);
function addRange(start, end) {
    const charCodeStart = start.charCodeAt(0);
    const charCodeEnd = end.charCodeAt(0);
    const length = charCodeEnd - charCodeStart + 1;
    for (let charCode = charCodeStart; charCode <= charCodeEnd; charCode += 1) {
        charToIndex[String.fromCharCode(charCode)] = indexToChar.length;
        indexToChar.push(charCode);
    }
}
addRange('A', 'Z');
addRange('a', 'z');
addRange('0', '9');
addRange('+', '+');
addRange('/', '/');
export function calculateBase64EncodedLength(inputLength) {
    const remainder = inputLength % 3;
    const paddingLength = remainder !== 0 ? 3 - remainder : 0;
    return [(inputLength + paddingLength) / 3 * 4, paddingLength];
}
export function encodeBase64(input, arg1, arg2, _arg3, _arg4) {
    var _a;
    if (input instanceof ArrayBuffer) {
        input = new Uint8Array(input);
    }
    // Because `Uint8Array` is type compatible with `ArrayBuffer`,
    // TypeScript doesn't correctly narrow `input` to `Uint8Array` when assigning.
    // Manually eliminate `ArrayBuffer` from `input` with a type guard.
    if (input instanceof ArrayBuffer) {
        return input;
    }
    let inputOffset;
    let inputLength;
    let output;
    let outputOffset;
    let outputArgumentIndex;
    if (typeof arg1 === 'number') {
        // overload 1, 3, 4
        inputOffset = arg1;
        if (typeof arg2 === 'number') {
            // overload 1, 4
            inputLength = arg2;
            outputArgumentIndex = 3;
        }
        else {
            // overload 3
            inputLength = input.byteLength - inputOffset;
            outputArgumentIndex = 2;
        }
    }
    else {
        // overload 2
        inputOffset = 0;
        inputLength = input.byteLength;
        outputArgumentIndex = 1;
    }
    const [outputLength, paddingLength] = calculateBase64EncodedLength(inputLength);
    let maybeOutput = arguments[outputArgumentIndex];
    let outputType;
    if (maybeOutput) {
        outputOffset = (_a = arguments[outputArgumentIndex + 1]) !== null && _a !== void 0 ? _a : 0;
        if (maybeOutput.byteLength - outputOffset < outputLength) {
            throw new Error('output buffer is too small');
        }
        if (maybeOutput instanceof ArrayBuffer) {
            output = new Uint8Array(maybeOutput);
        }
        else {
            output = maybeOutput;
        }
        outputType = 'number';
    }
    else {
        const buffer = new ArrayBuffer(outputLength);
        output = new Uint8Array(buffer);
        outputOffset = 0;
        outputType = 'ArrayBuffer';
    }
    // Because `Uint8Array` is type compatible with `ArrayBuffer`,
    // TypeScript doesn't correctly narrow `output` to `Uint8Array` when assigning.
    // Manually eliminate `ArrayBuffer` from `output` with a type guard.
    if (output instanceof ArrayBuffer) {
        return output;
    }
    if (input.buffer === output.buffer) {
        const bufferInputStart = input.byteOffset + inputOffset;
        const bufferOutputStart = output.byteOffset + outputOffset;
        if (bufferOutputStart < bufferInputStart - 1) {
            const bufferOutputEnd = bufferOutputStart + outputLength;
            if (bufferOutputEnd >= bufferInputStart) {
                throw new Error('input and output buffer can not be overlapping');
            }
        }
    }
    // Run backward to do in-place overwrite
    let inputIndex = inputOffset + inputLength - 1;
    let outputIndex = outputOffset + outputLength - 1;
    if (paddingLength === 2) {
        // aaaaaabb
        const x = input[inputIndex];
        inputIndex -= 1;
        output[outputIndex] = paddingChar;
        outputIndex -= 1;
        output[outputIndex] = paddingChar;
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((x & 0b11) << 4)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[x >> 2];
        outputIndex -= 1;
    }
    else if (paddingLength === 1) {
        // bbbbcccc
        const y = input[inputIndex];
        inputIndex -= 1;
        // aaaaaabb
        const x = input[inputIndex];
        inputIndex -= 1;
        output[outputIndex] = paddingChar;
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((y & 0b1111) << 2)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((x & 0b11) << 4) | (y >> 4)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[x >> 2];
        outputIndex -= 1;
    }
    while (inputIndex >= inputOffset) {
        // ccdddddd
        const z = input[inputIndex];
        inputIndex -= 1;
        // bbbbcccc
        const y = input[inputIndex];
        inputIndex -= 1;
        // aaaaaabb
        const x = input[inputIndex];
        inputIndex -= 1;
        output[outputIndex] = indexToChar[z & 0b111111];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((y & 0b1111) << 2) | (z >> 6)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[((x & 0b11) << 4) | (y >> 4)];
        outputIndex -= 1;
        output[outputIndex] = indexToChar[x >> 2];
        outputIndex -= 1;
    }
    if (outputType === 'ArrayBuffer') {
        return output.buffer;
    }
    else {
        return outputLength;
    }
}
export function decodeBase64(input) {
    let padding;
    if (input[input.length - 2] === '=') {
        padding = 2;
    }
    else if (input[input.length - 1] === '=') {
        padding = 1;
    }
    else {
        padding = 0;
    }
    const result = new Uint8Array(input.length / 4 * 3 - padding);
    let sIndex = 0;
    let dIndex = 0;
    while (sIndex < input.length - (padding !== 0 ? 4 : 0)) {
        const a = charToIndex[input[sIndex]];
        sIndex += 1;
        const b = charToIndex[input[sIndex]];
        sIndex += 1;
        const c = charToIndex[input[sIndex]];
        sIndex += 1;
        const d = charToIndex[input[sIndex]];
        sIndex += 1;
        result[dIndex] = (a << 2) | ((b & 48) >> 4);
        dIndex += 1;
        result[dIndex] = ((b & 0b1111) << 4) | ((c & 60) >> 2);
        dIndex += 1;
        result[dIndex] = ((c & 0b11) << 6) | d;
        dIndex += 1;
    }
    if (padding === 1) {
        const a = charToIndex[input[sIndex]];
        sIndex += 1;
        const b = charToIndex[input[sIndex]];
        sIndex += 1;
        const c = charToIndex[input[sIndex]];
        result[dIndex] = (a << 2) | ((b & 48) >> 4);
        dIndex += 1;
        result[dIndex] = ((b & 0b1111) << 4) | ((c & 60) >> 2);
    }
    else if (padding === 2) {
        const a = charToIndex[input[sIndex]];
        sIndex += 1;
        const b = charToIndex[input[sIndex]];
        result[dIndex] = (a << 2) | ((b & 48) >> 4);
    }
    return result.buffer;
}
//# sourceMappingURL=base64.js.map