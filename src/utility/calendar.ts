import moment from "moment";
import type { Moment } from "moment";
import { _get } from "./generic";
import type { Id, ITimeSteps, TimelineGroupBase, TimelineItemBase, TimelineKeys, TimeUnit } from "../types";

export type GroupOrder = { index: number, group: TimelineGroupBase};
export type GroupOrders = Record<string | number, GroupOrder>;

export type VerticalDimensions = {
    left: number,
    width: number,
    collisionLeft: number,
    collisionWidth: number,
};

export type Dimensions = VerticalDimensions & {
    top: number | null;
    order: GroupOrder;
    stack: boolean;
    height: number;
};

export type ItemDimensions = {
    id: Id,
    dimensions: Dimensions,
};

/**
 * Calculate the ms / pixel ratio of the timeline.
 * 
 * @param canvasTimeStart The millisecond value at the left edge of the canvas.
 * @param canvasTimeEnd The millisecond value at the right edge of the canvas.
 * @param canvasWidth The width of the canvas in pixels.
 * @returns The time represented by a single pixel on the canvas in milliseconds.
 */
export function millisecondsInPixel(canvasTimeStart: number, canvasTimeEnd: number, canvasWidth: number): number {
    return (canvasTimeEnd - canvasTimeStart) / canvasWidth;
}

/**
 * Calculate the X position on the canvas for a given time.
 * 
 * @param canvasTimeStart The millisecond value at the left edge of the canvas.
 * @param canvasTimeEnd The millisecond value at the right edge of the canvas.
 * @param canvasWidth The width of the canvas in pixels.
 * @param time The time to get the X position for.
 * @returns The X position on the canvas representing the given time in pixels.
 */
export function calculateXPositionForTime(canvasTimeStart: number, canvasTimeEnd: number, canvasWidth: number, time: number): number {
    const widthToZoomRatio = canvasWidth / (canvasTimeEnd - canvasTimeStart);
    const timeOffset = time - canvasTimeStart;

    return timeOffset * widthToZoomRatio;
}

/**
 * For a given x position (leftOffset) in pixels, calculate time based on
 * timeline state (timeline width in px, canvas time range).
 * 
 * @param canvasTimeStart The millisecond value at the left edge of the canvas.
 * @param canvasTimeEnd The millisecond value at the right edge of the canvas.
 * @param canvasWidth The width of the canvas in pixels.
 * @param leftOffset The X position in pixels to calculate the time for.
 * @returns The time represented by the given X position (leftOffset).
 */
export function calculateTimeForXPosition(canvasTimeStart: number, canvasTimeEnd: number, canvasWidth: number, leftOffset: number): number {
    const timeToPxRatio = millisecondsInPixel(canvasTimeStart, canvasTimeEnd, canvasWidth);
    const timeFromCanvasTimeStart = timeToPxRatio * leftOffset;

    return timeFromCanvasTimeStart + canvasTimeStart;
}

/**
 * Iterates over time units in a time window and calls a callback at each step. For example it
 * calls the callback with every time instant that represents the beginning of a day between
 * two dates. The first call of the callback function will include the start time, so it could
 * easily represent an interval that actually starts before the start time. The last interval
 * to call the callback function will similarly include the end time.
 * 
 * @param start Where the iteration starts in milliseconds.
 * @param end Where the iteration ends in milliseconds.
 * @param unit The unit of the iteration (for example days).
 * @param timeSteps An object describing how many steps to go in each iteration depending on the unit.
 * @param callback The callback that will be called in each iteration.
 */
export function iterateTimes(start: number, end: number, unit: keyof ITimeSteps, timeSteps: ITimeSteps, callback: (time: Moment, nextTime: Moment) => void): void {
    let time = moment(start).startOf(unit);
    const steps = timeSteps[unit] ?? 1;

    // If we need to go more steps in an iteration (like iterate every 30 minutes), we need to find the
    // last "whole" time before the start. So if start is at 2022.05.05.10:34, we will iterate like
    // 2022.05.05.10:30, 2022.05.05.11:00 and so on (and not 2022.05.05.10:34, 2022.05.05.11:04, ...).
    if (steps > 1) {
        let value = time.get(unit);
        time.set(unit, value - (value % steps));
    }

    // The actual iteration
    while (time.valueOf() < end) {
        let nextTime = moment(time).add(steps, unit);
        callback(time, nextTime);
        time = nextTime;
    }
}

// the smallest cell we want to render is 17px
// this can be manipulated to make the breakpoints change more/less
// i.e. on zoom how often do we switch to the next unit of time
// i think this is the distance between cell lines
export const minCellWidth = 17;

// for supporting weeks, its important to remember that each of these
// units has a natural progression to the other. i.e. a year is 12 months
// a month is 24 days, a day is 24 hours.
// with weeks this isnt the case so weeks needs to be handled specially
const timeDividers = {
    second: 1000,
    minute: 60,
    hour: 60,
    day: 24,
    month: 30,
    year: 12,
};

/**
 * Determine the current rendered time unit based on timeline time span.
 * 
 * This function is VERY HOT as its used in Timeline.js render function.
 * TODO: check if there are performance implications here.
 * When "weeks" feature is implemented, this function will be modified heavily.
 *
 * @param zoom Difference between time start and time end of timeline canvas (in milliseconds).
 * @param width Width of timeline canvas (in pixels).
 * @param timeSteps Map of time units with number to indicate step of each unit.
 */
export function getMinUnit(zoom: number, width: number, timeSteps: ITimeSteps) {
    let minUnit = "year";

    // this timespan is in ms initially
    let nextTimeSpanInUnitContext = zoom;

    let unit: TimeUnit;
    for (unit in timeDividers) {
        const stepForUnit = timeSteps[unit] ?? 1;

        // converts previous time span to current unit
        // (e.g. milliseconds to seconds, seconds to minutes, etc)
        nextTimeSpanInUnitContext = nextTimeSpanInUnitContext / timeDividers[unit];

        // timeSteps is "
        // With what step to display different units. E.g. 15 for minute means only minutes 0, 15, 30 and 45 will be shown."
        // how many cells would be rendered given this time span, for this unit?
        // e.g. for time span of 60 minutes, and time step of 1, we would render 60 cells
        const cellsToBeRenderedForCurrentUnit = nextTimeSpanInUnitContext / stepForUnit;

        // what is happening here? why 3 if time steps are greater than 1??
        const cellWidthToUse = stepForUnit > 1 ? 3 * minCellWidth : minCellWidth;

        // for the minWidth of a cell, how many cells would be rendered given
        // the current pixel width
        // i.e. f
        const minimumCellsToRenderUnit = width / cellWidthToUse;

        if (cellsToBeRenderedForCurrentUnit < minimumCellsToRenderUnit) {
            // for the current zoom, the number of cells we'd need to render all parts of this unit
            // is less than the minimum number of cells needed at minimum cell width
            minUnit = unit;
            break;
        }
    }

    return minUnit;
}

const nextTimeUnitMap: Record<TimeUnit, TimeUnit> = {
    second: "minute",
    minute: "hour",
    hour: "day",
    day: "month",
    month: "year",
    year: "year",
}

/**
 * Returns the next, one step longer time unit.
 * 
 * @param unit The time unit to get the next unit for.
 * @returns The time unit that is one step longer or the longest time unit.
 */
export function getNextUnit(unit: TimeUnit): TimeUnit {
    return nextTimeUnitMap[unit];
}

/**
 * Get the new start and new end time of item that is being
 * dragged or resized.
 * 
 * @param itemTimeStart original item time in milliseconds
 * @param itemTimeEnd original item time in milliseconds
 * @param dragTime new start time if item is dragged in milliseconds
 * @param isDragging is item being dragged
 * @param isResizing is item being resized
 * @param resizingEdge resize edge
 * @param resizeTime new resize time in milliseconds
 */
function calculateInteractionNewTimes({itemTimeStart, itemTimeEnd, dragTime, isDragging, isResizing, resizingEdge, resizeTime}: {
    itemTimeStart: number,
    itemTimeEnd: number,
    dragTime: number,
    isDragging: boolean,
    isResizing: boolean,
    resizingEdge: "left" | "right",
    resizeTime: number,
}) {
    const originalItemRange = itemTimeEnd - itemTimeStart;
    const itemStart = isResizing && resizingEdge === "left" ? resizeTime : itemTimeStart;
    const itemEnd = isResizing && resizingEdge === "right" ? resizeTime : itemTimeEnd;
    return [isDragging ? dragTime : itemStart, isDragging ? dragTime + originalItemRange : itemEnd];
}

/**
 * Calculates the vertical dimension of an item on the chart.
 * 
 * @param itemTimeStart The start time of the item in milliseconds.
 * @param itemTimeEnd The end time of the item in milliseconds.
 * @param canvasTimeStart The start time of the canvas in milliseconds.
 * @param canvasTimeEnd The end time of the canvas in milliseconds.
 * @param canvasWidth The width of the canvas in pixels.
 * @returns The dimensions of the item where left is the start position on the canvas in pixels, width is also measured in pixels,
 *          collisionLeft is the start time in milliseconds, collisionWidth is the duration in milliseconds.
 */
function calculateDimensions({ itemTimeStart, itemTimeEnd, canvasTimeStart, canvasTimeEnd, canvasWidth } : {
    itemTimeStart: number,
    itemTimeEnd: number,
    canvasTimeStart: number,
    canvasTimeEnd: number,
    canvasWidth: number,
}):VerticalDimensions {
    const itemTimeRange = itemTimeEnd - itemTimeStart;

    // restrict startTime and endTime to be bounded by canvasTimeStart and canvasTimeEnd
    const effectiveStartTime = Math.max(itemTimeStart, canvasTimeStart);
    const effectiveEndTime = Math.min(itemTimeEnd, canvasTimeEnd);

    const left = calculateXPositionForTime(canvasTimeStart, canvasTimeEnd, canvasWidth, effectiveStartTime);
    const right = calculateXPositionForTime(canvasTimeStart, canvasTimeEnd, canvasWidth, effectiveEndTime);
    const itemWidth = right - left;

    const dimensions = {
        left: left,
        width: Math.max(itemWidth, 3),
        collisionLeft: itemTimeStart,
        collisionWidth: itemTimeRange,
    };

    return dimensions;
}

/**
 * Get the order of groups based on their keys.
 * 
 * @param groups Array of groups.
 * @param keys The keys object.
 * @returns Ordered hash from group ids to the group index in the array and the group itself.
 */
export function getGroupOrders(groups: TimelineGroupBase[], keys: TimelineKeys): GroupOrders {
    const { groupIdKey } = keys;

    let groupOrders: GroupOrders = {};

    for (let i = 0; i < groups.length; i++) {
        groupOrders[_get(groups[i], groupIdKey)] = { index: i, group: groups[i] };
    }

    return groupOrders;
}

/**
 * Adds items relevant to each group to the result of getGroupOrders
 * @param items list of all items
 * @param groupOrders the result of getGroupOrders
 */
function getGroupedItems(items: ItemDimensions[], groupOrders: GroupOrders) {
    let groupedItems: { index: number, group: TimelineGroupBase, items: ItemDimensions[]}[] = [];
    let keys = Object.keys(groupOrders);
    // Initialize with result object for each group
    for (let i = 0; i < keys.length; i++) {
        const groupOrder = groupOrders[keys[i]];
        groupedItems.push({
            index: groupOrder.index,
            group: groupOrder.group,
            items: [],
        });
    }

    // Populate groups
    for (let i = 0; i < items.length; i++) {
        if (items[i].dimensions.order !== undefined) {
            const groupItem = groupedItems[items[i].dimensions.order.index];
            if (groupItem) {
                groupItem.items.push(items[i]);
            }
        }
    }

    return groupedItems;
}

/**
 * Filters timeline items to those that should be visible on the canvas.
 * 
 * @param items The timeline items to filter.
 * @param canvasTimeStart The start time of the canvas in milliseconds.
 * @param canvasTimeEnd The end time of the canvas in milliseconds.
 * @param keys The keys object.
 * @returns The filtered list of timeline items.
 */
export function getVisibleItems(items: TimelineItemBase[], canvasTimeStart: number, canvasTimeEnd: number, keys: TimelineKeys) {
    const { itemTimeStartKey, itemTimeEndKey } = keys;

    return items.filter(item => {
        return _get(item, itemTimeStartKey) <= canvasTimeEnd && _get(item, itemTimeEndKey) >= canvasTimeStart;
    });
}

const EPSILON = 0.001;

/**
 * Calculates whether two items are colliding on the chart.
 * @param a  The dimensions of the first item. Its 'top' should not be null when this function is called.
 * @param b  The dimensions of the second item. Its 'top' should not be null when this function is called.
 * @param lineHeight  Unused parameter to confuse developers.
 * @param collisionPadding  A small collision padding, so touching items don't collide due to a rounding error.
 * @returns  True if the two items overlap.
 */
function collision(a: Dimensions, b: Dimensions, collisionPadding = EPSILON): boolean {
    if (a.top === null || b.top === null) {
        // This function should not be called before the item top is set for both items.
        return false;
    }
    // 2d collisions detection - https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
    const verticalMargin = 0;

    return (
        a.collisionLeft + collisionPadding < b.collisionLeft + b.collisionWidth &&
        a.collisionLeft + a.collisionWidth - collisionPadding > b.collisionLeft &&
        a.top - verticalMargin + collisionPadding < b.top + b.height &&
        a.top + a.height + verticalMargin - collisionPadding > b.top
    );
}

/**
 * Calculate the position of a given item for a group that is being stacked.
 * 
 * @param lineHeight  The height of a line in pixels.
 * @param item  The item to calculate the position for.
 * @param group  All the items in the same group as 'item'.
 * @param groupHeight  The current group height in pixels (calculated by previously stacked items).
 * @param groupTop  The top position of the group in pixels.
 * @param itemIndex  The index of the 'item' within 'group'.
 * @returns  A potentially increased group height.
 */
function groupStack(lineHeight: number, item: ItemDimensions, group: ItemDimensions[], groupHeight: number, groupTop: number, itemIndex: number): number {
    // calculate non-overlapping positions
    let curHeight = groupHeight;
    let verticalMargin = (lineHeight - item.dimensions.height) / 2;
    if (item.dimensions.stack && item.dimensions.top === null) {
        item.dimensions.top = groupTop + verticalMargin;
        curHeight = Math.max(curHeight, lineHeight);
        let collidingItem;
        do {
            collidingItem = null;
            //Items are placed from i=0 onwards, only check items with index < i
            for (let j = itemIndex - 1; j >= 0; j--) {
                let other = group[j];
                if (
                    other.dimensions.top !== null &&
                    other.dimensions.stack &&
                    collision(item.dimensions, other.dimensions)
                ) {
                    collidingItem = other;
                    break;
                } else {
                    // console.log('dont test', other.top !== null, other !== item, other.stack);
                }
            }

            if (collidingItem != null) {
                // There is a collision. Reposition the items above the colliding element
                // collidingItem.dimensions.top is never null here - added the check to make typescript happy
                item.dimensions.top = (collidingItem.dimensions.top ?? 0) + lineHeight;
                curHeight = Math.max(
                    curHeight,
                    item.dimensions.top + item.dimensions.height + verticalMargin - groupTop,
                );
            }
        } while (collidingItem);
    }
    return curHeight;
}

/**
 * Calculate the position of an item for a group that is not being stacked.
 * 
 * @param lineHeight  The height of a line in pixels.
 * @param item  The item to calculate the position for.
 * @param groupHeight  The current group height in pixels (calculated by previously stacked items).
 * @param groupTop  The top position of the group in pixels.
 * @returns  A potentially increased group height.
 */
function groupNoStack(lineHeight: number, item: ItemDimensions, groupHeight: number, groupTop: number): number {
    let verticalMargin = (lineHeight - item.dimensions.height) / 2;
    if (item.dimensions.top === null) {
        item.dimensions.top = groupTop + verticalMargin;
        groupHeight = Math.max(groupHeight, lineHeight);
    }
    return groupHeight;
}

/**
 * Stack all groups.
 * 
 * @param itemsDimensions  The dimensions of items to be stacked.
 * @param groupOrders  The groupOrders object.
 * @param lineHeight  The height of a single line in pixels.
 * @param stackItems  Whether items should be stacked by default.
 * @returns  The height of the whole chart, the height of each group, and the top position of each group.
 */
function stackAll(itemsDimensions: ItemDimensions[], groupOrders: GroupOrders, lineHeight: number, stackItems: boolean) {
    let groupHeights: number[] = [];
    let groupTops: number[] = [];
    let currentHeight: number = 0;

    const groupedItems = getGroupedItems(itemsDimensions, groupOrders);

    for (let index in groupedItems) {
        const groupItems = groupedItems[index];
        const { items: itemsDimensions, group } = groupItems;
        const groupTop = currentHeight;

        // Is group being stacked?
        const isGroupStacked = group.stackItems ?? stackItems;
        const groupHeight = stackGroup(itemsDimensions, isGroupStacked, lineHeight, groupTop);

        groupTops.push(groupTop);
        // If group height is overridden, push new height
        // Do this late as item position still needs to be calculated
        let effectiveGroupHeight: number;
        if (group.height) {
            effectiveGroupHeight = group.height;
        } else {
            effectiveGroupHeight = Math.max(groupHeight, lineHeight);
        }
        currentHeight += effectiveGroupHeight;
        groupHeights.push(effectiveGroupHeight);
    }

    return {
        height: currentHeight,
        groupHeights,
        groupTops,
    };
}

/**
 * Calculates the position of each item in a group.
 * 
 * @param itemsDimensions  The dimensions of each item in the group.
 * @param isGroupStacked  Whether items in the group should stack.
 * @param lineHeight  The line height in pixels.
 * @param groupTop  The top position of the group.
 * @returns  The calculated height of the group.
 */
function stackGroup(itemsDimensions: ItemDimensions[], isGroupStacked: boolean, lineHeight: number, groupTop: number): number {
    let groupHeight = 0;
    // Find positions for each item in group
    for (let itemIndex = 0; itemIndex < itemsDimensions.length; itemIndex++) {
        let r = {};
        if (isGroupStacked) {
            groupHeight = groupStack(lineHeight, itemsDimensions[itemIndex], itemsDimensions, groupHeight, groupTop, itemIndex);
        } else {
            groupHeight = groupNoStack(lineHeight, itemsDimensions[itemIndex], groupHeight, groupTop);
        }
    }
    return groupHeight;
}

/**
 * Stack the items that will be visible within the canvas area.
 * 
 * @param items  All the items on the chart.
 * @param groups  All the groups on the chart.
 * @param canvasWidth  The width of the canvas in pixels.
 * @param canvasTimeStart  The start time of the canvas in milliseconds.
 * @param canvasTimeEnd  The end time of the canvas in milliseconds.
 * @param keys  The keys object.
 * @param lineHeight  The height of a single line in pixels.
 * @param itemHeightRatio  The ratio of the height of an item to the height of the line.
 * @param stackItems  Whether items should be stacked by default.
 * @param draggingItem  The id of the item being dragged.
 * @param resizingItem  The id of the item being resized.
 * @param dragTime  The current drag position in milliseconds.
 * @param resizingEdge  Whether the resized item is resized on the left or the right edge.
 * @param resizeTime  The current resize position in milliseconds.
 * @param newGroupOrder  The index of the group the dragged item is being dragged to.
 * @returns  The calculated item dimensions, the height of the whole chart, the height of
 *           each group, and the top position for each group.
 */
export function stackTimelineItems(
    items: TimelineItemBase[],
    groups: TimelineGroupBase[],
    canvasWidth: number,
    canvasTimeStart: number,
    canvasTimeEnd: number,
    keys: TimelineKeys,
    lineHeight: number,
    itemHeightRatio: number,
    stackItems: boolean,
    draggingItem: Id,
    resizingItem: Id,
    dragTime: number,
    resizingEdge: "left" | "right",
    resizeTime: number,
    newGroupOrder: number,
) {
    const visibleItems = getVisibleItems(items, canvasTimeStart, canvasTimeEnd, keys);
    const visibleItemsWithInteraction = visibleItems.map(item =>
        getItemWithInteractions({
            item,
            keys,
            draggingItem,
            resizingItem,
            dragTime,
            resizingEdge,
            resizeTime,
            groups,
            newGroupOrder,
        }),
    );

    // if there are no groups return an empty array of dimensions
    if (groups.length === 0) {
        return {
            dimensionItems: [],
            height: 0,
            groupHeights: [],
            groupTops: [],
        };
    }

    // Get the order of groups based on their id key
    const groupOrders = getGroupOrders(groups, keys);
    let dimensionItems = visibleItemsWithInteraction
        .map(item =>
            getItemDimensions({
                item,
                keys,
                canvasTimeStart,
                canvasTimeEnd,
                canvasWidth,
                groupOrders,
                lineHeight,
                itemHeightRatio,
            }),
        );
    // Get a new array of groupOrders holding the stacked items
    const { height, groupHeights, groupTops } = stackAll(dimensionItems, groupOrders, lineHeight, stackItems);
    return { dimensionItems, height, groupHeights, groupTops };
}

/**
 * Get canvas width from visible width.
 * 
 * @param width  The visible width in pixels.
 * @param buffer  The buffer ratio - 3 by default, so the actual canvas will be 3 times as wide.
 */
export function getCanvasWidth(width: number, buffer = 3) {
    return width * buffer;
}

/**
 * Get item's position, dimensions and collisions.
 * 
 * @param item  The item to get the dimensions for.
 * @param keys  The keys object.
 * @param canvasTimeStart  The time at the left edge of the canvas in milliseconds.
 * @param canvasTimeEnd  The time at the right edge of the canvas in milliseconds.
 * @param canvasWidth  The width of the canvas in pixels.
 * @param groupOrders  The group orders.
 * @param lineHeight  The height of a row in pixels.
 * @param itemHeightRatio  The ratio of the height of an item to the height of the row.
 * @returns  The calculated dimensions the item.
 */
function getItemDimensions({
    item,
    keys,
    canvasTimeStart,
    canvasTimeEnd,
    canvasWidth,
    groupOrders,
    lineHeight,
    itemHeightRatio,
}: {
    item: TimelineItemBase,
    keys: TimelineKeys,
    canvasTimeStart: number,
    canvasTimeEnd: number,
    canvasWidth: number,
    groupOrders: GroupOrders,
    lineHeight: number,
    itemHeightRatio: number,
}):  { id: Id, dimensions: Dimensions } {
    const itemId = _get(item, keys.itemIdKey);
    const verticalDimensions :VerticalDimensions = calculateDimensions({
        itemTimeStart: _get(item, keys.itemTimeStartKey),
        itemTimeEnd: _get(item, keys.itemTimeEndKey),
        canvasTimeStart,
        canvasTimeEnd,
        canvasWidth,
    });

    const dimensions = {
        ...verticalDimensions,
        top: null,
        order: groupOrders[_get(item, keys.itemGroupKey)],
        // Disabled the undocumented magic that if an item has an isOverlay=true property we won't stack it.
        // stack: !item.isOverlay;
        stack: true,
        height: lineHeight * itemHeightRatio
    };
    return {
        id: itemId,
        dimensions,
    };
    
}

/**
 * Get new item with changed  `itemTimeStart` , `itemTimeEnd` and `itemGroupKey` according
 * to user interaction (dragging an item or resizing left or right).
 * 
 * @param item  The item to check.
 * @param keys  The keys object.
 * @param draggingItem  The id of the item being dragged.
 * @param resizingItem  The id of the item being resized.
 * @param dragTime  The current drag position in milliseconds.
 * @param resizingEdge  Whether the resized item is resized on the left or the right edge.
 * @param resizeTime  The current resize position in milliseconds.
 * @param groups  The groups of the chart.
 * @param newGroupOrder  The index of the group the dragged item is being dragged into.
 * @returns  A new item object with updated properties.
 */
function getItemWithInteractions({
    item,
    keys,
    draggingItem,
    resizingItem,
    dragTime,
    resizingEdge,
    resizeTime,
    groups,
    newGroupOrder,
}: { 
    item: TimelineItemBase;
    keys: TimelineKeys;
    draggingItem: Id;
    resizingItem: Id;
    dragTime: number;
    resizingEdge: "left" | "right";
    resizeTime: number;
    groups: TimelineGroupBase[];
    newGroupOrder: number;
}) {
    if (!resizingItem && !draggingItem) return item;
    const itemId = _get(item, keys.itemIdKey);
    const isDragging = itemId === draggingItem;
    const isResizing = itemId === resizingItem;
    const [itemTimeStart, itemTimeEnd] = calculateInteractionNewTimes({
        itemTimeStart: _get(item, keys.itemTimeStartKey),
        itemTimeEnd: _get(item, keys.itemTimeEndKey),
        isDragging,
        isResizing,
        dragTime,
        resizingEdge,
        resizeTime,
    });
    const newItem = {
        ...item,
        [keys.itemTimeStartKey]: itemTimeStart,
        [keys.itemTimeEndKey]: itemTimeEnd,
        [keys.itemGroupKey]: isDragging ? _get(groups[newGroupOrder], keys.groupIdKey) : _get(item, keys.itemGroupKey),
    };
    return newItem;
}

/**
 * Get canvas start and end time from visible start and end time.
 * 
 * @param visibleTimeStart  The visible start time in milliseconds.
 * @param visibleTimeEnd  The visible end time in milliseconds.
 */
export function getCanvasBoundariesFromVisibleTime(visibleTimeStart: number, visibleTimeEnd: number) {
    const zoom = visibleTimeEnd - visibleTimeStart;
    const canvasTimeStart = visibleTimeStart - zoom;
    const canvasTimeEnd = visibleTimeEnd + zoom;
    return [canvasTimeStart, canvasTimeEnd];
}

/**
 * Get the canvas area for a given visible time. Will shift the start/end of
 * the canvas if the visible time does not fit within the existing canvas.
 * 
 * @param visibleTimeStart  The visible start time in milliseconds.
 * @param visibleTimeEnd  The visible end time in milliseconds.
 * @param forceUpdateDimensions  Whether to force a new canvas even if the visible
 *                               time window would fit into the existing one.
 * @param items  All the items of the timeline.
 * @param groups  All the groups of the timeline.
 * @param props  The props of the Timeline.
 * @param state  The state of the Timeline.
 * @returns  An object containing some updates to the state of the Timeline.
 */
export function calculateScrollCanvas(
    visibleTimeStart: number,
    visibleTimeEnd: number,
    forceUpdateDimensions: boolean,
    items: TimelineItemBase[],
    groups: TimelineGroupBase[],
    props: any,
    state: any,
) {
    const oldCanvasTimeStart = state.canvasTimeStart;
    const oldZoom = state.visibleTimeEnd - state.visibleTimeStart;
    const newZoom = visibleTimeEnd - visibleTimeStart;
    const newState: {
        visibleTimeStart: number,
        visibleTimeEnd: number,
        canvasTimeStart?: number,
        canvasTimeEnd?: number
    } = { visibleTimeStart, visibleTimeEnd };

    // Check if the current canvas covers the new times
    const canKeepCanvas =
        newZoom === oldZoom &&
        visibleTimeStart >= oldCanvasTimeStart + oldZoom * 0.5 &&
        visibleTimeStart <= oldCanvasTimeStart + oldZoom * 1.5 &&
        visibleTimeEnd >= oldCanvasTimeStart + oldZoom * 1.5 &&
        visibleTimeEnd <= oldCanvasTimeStart + oldZoom * 2.5;

    if (!canKeepCanvas || forceUpdateDimensions) {
        const [canvasTimeStart, canvasTimeEnd] = getCanvasBoundariesFromVisibleTime(visibleTimeStart, visibleTimeEnd);
        newState.canvasTimeStart = canvasTimeStart;
        newState.canvasTimeEnd = canvasTimeEnd;
        const mergedState = {
            ...state,
            ...newState,
        };

        const canvasWidth = getCanvasWidth(mergedState.width);

        // The canvas cannot be kept, so calculate the new items position
        Object.assign(
            newState,
            stackTimelineItems(
                items,
                groups,
                canvasWidth,
                mergedState.canvasTimeStart,
                mergedState.canvasTimeEnd,
                props.keys,
                props.lineHeight,
                props.itemHeightRatio,
                props.stackItems,
                mergedState.draggingItem,
                mergedState.resizingItem,
                mergedState.dragTime,
                mergedState.resizingEdge,
                mergedState.resizeTime,
                mergedState.newGroupOrder,
            ),
        );
    }
    return newState;
}
