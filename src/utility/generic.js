export function arraysEqual(array1, array2) {
    return array1.length === array2.length && array1.every((element, index) => element === array2[index]);
}

export function keyBy(value, key) {
    let obj = {};

    value.forEach(function (element) {
        obj[element[key]] = element;
    });

    return obj;
}

export function noop() {
    // No linter warning
}
