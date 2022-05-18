// TODO: can we use getBoundingClientRect instead??
// last place this is used is in "handleWheel" in ScrollElement
export function getParentPosition(element: HTMLElement | null) {
    let xPosition = 0;
    let yPosition = 0;
    let first = true;

    while (element) {
        if (
            !element.offsetParent &&
            element.tagName === "BODY" &&
            element.scrollLeft === 0 &&
            element.scrollTop === 0
        ) {
            element = (document.scrollingElement || element) as HTMLElement;
        }
        xPosition += element.offsetLeft - (first ? 0 : element.scrollLeft) + element.clientLeft;
        yPosition += element.offsetTop - (first ? 0 : element.scrollTop) + element.clientTop;
        element = element.offsetParent as HTMLElement;
        first = false;
    }
    return { x: xPosition, y: yPosition };
}

export function getSumScroll(node: HTMLElement | null): { scrollLeft: number; scrollTop: number } {
    if (node === null) {
        throw new Error(`This should never happen> the node to calculate sum scroll is null`);
    }

    if (node === document.body) {
        return { scrollLeft: 0, scrollTop: 0 };
    } else {
        const parent = getSumScroll(node.parentNode as HTMLElement);
        return {
            scrollLeft: node.scrollLeft + parent.scrollLeft,
            scrollTop: node.scrollTop + parent.scrollTop,
        };
    }
}

export function getSumOffset(node: HTMLElement | null): { offsetLeft: number; offsetTop: number } {
    if (node === null) {
        throw new Error(`This should never happen> the node to calculate sum offset is null`);
    }

    if (node === document.body || !node.offsetParent) {
        return { offsetLeft: 0, offsetTop: 0 };
    } else {
        const parent = getSumOffset(node.offsetParent as HTMLElement);
        return {
            offsetLeft: node.offsetLeft + parent.offsetLeft,
            offsetTop: node.offsetTop + parent.offsetTop,
        };
    }
}
