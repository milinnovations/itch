export function* map<TItem, TResult>(items: Iterable<TItem>, mapper: (i: TItem) => TResult) {
    for (const i of items) yield mapper(i);
}

export function* mapRange<T>(end: number, map: (index: number) => T) {
    for (let index = 0; index < end; index++) {
        yield map(index);
    }
}
