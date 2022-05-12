export function* mapRange<T>(end: number, map: (index: number) => T) {
    for (let index = 0; index < end; index++) {
        yield map(index);
    }
}
