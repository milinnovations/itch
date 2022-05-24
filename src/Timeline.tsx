import React, { Component } from "react";
import isEqual from "lodash.isequal";
import { Moment } from "moment";
import PropTypes from "prop-types";

import Columns from "./columns/Columns";
import { defaultTimeSteps } from "./default-config";
import DateHeader from "./headers/DateHeader";
import { TimelineHeadersProvider } from "./headers/HeadersContext";
import TimelineHeaders from "./headers/TimelineHeaders";
import Items from "./items/Items";
import Sidebar from "./layout/Sidebar";
import MarkerCanvas from "./markers/MarkerCanvas";
import { TimelineMarkersProvider } from "./markers/TimelineMarkersContext";
import { GroupRows } from "./row/GroupRows";
import ScrollElement from "./scroll/ScrollElement";
import { TimelineStateProvider } from "./timeline/TimelineStateContext";
import {
    getMinUnit,
    calculateTimeForXPosition,
    calculateScrollCanvas,
    getCanvasBoundariesFromVisibleTime,
    getCanvasWidth,
    stackTimelineItems,
    ItemDimensions,
    Dimensions,
} from "./utility/calendar";
import { mapRange } from "./utility/generators";
import { binarySearch } from "./utility/search";

import type {
    ClickType,
    CompleteTimeSteps,
    Id,
    ITimeSteps,
    ReactCalendarTimelineProps,
    TimelineGroupBase,
    TimelineItemBase,
    TimelineItemEdge,
    TimeUnit,
} from "./types";

type ReactNodeWithPossibleTypeAndSecretKey = React.ReactNode & { type?: { secretKey?: unknown } };
type ReactElementWithPossibleTypeAndSecretKey = React.ReactElement & { type?: { secretKey?: unknown } };

/**
 * Default style for the Timeline container div.
 */
const defaultContainerStyle: React.CSSProperties = { height: "100%", overflowY: "auto" };

/**
 * Finds the index of the first fully visible group.
 *
 * @param {number[]} groupTops  The top coordinates of the groups in order.
 * @param {number} visibleTop  The topmost coordinate that is visible.
 *
 * @returns  The index of the first fully visible group.
 */
function findFirstFullyVisibleGroupIndex(groupTops: number[], visibleTop: number) {
    return binarySearch(groupTops, groupTop => (groupTop >= visibleTop ? 0 : -1), "leftmost");
}

/**
 * Calculates new vertical canvas dimensions to comfortably cover the visible area.
 *
 * @param {number} visibleTop  The Y coordinate at the top of the visible part in pixels.
 * @param {number} visibleHeight  The Y coordinate at the bottom of the visible part in pixels.
 *
 * @returns  The top and the bottom of the new canvas in pixels.
 */
function getNewVerticalCanvasDimensions(visibleTop: number, visibleHeight: number) {
    const visibleBottom = visibleTop + visibleHeight;
    const top = visibleTop - visibleHeight;
    const bottom = visibleBottom + visibleHeight;
    return { top, bottom };
}

/**
 * Checks whether a new vertical canvas should be drawn.
 *
 * @param {number} visibleTop  The Y coordinate at the top of the visible part in pixels.
 * @param {number} visibleHeight  The Y coordinate at the bottom of the visible part in pixels.
 * @param {number} canvasTop  The Y coordinate at the top of the current canvas.
 * @param {number} canvasBottom  The Y coordinate at the bottom of the current canvas.
 *
 * @returns  True if the visible part of the chart is too close to the edge of the canvas.
 */
function needNewVerticalCanvas(visibleTop: number, visibleHeight: number, canvasTop: number, canvasBottom: number) {
    const treshold = visibleHeight * 0.5;
    const visibleBottom = visibleTop + visibleHeight;
    return visibleTop - canvasTop < treshold || canvasBottom - visibleBottom < treshold;
}

/**
 * Calculates the possibly visible groups. It will overshoot the actual number of visible
 * groups if some groups have a line height that is more than a normal line height, but
 * it guarantees that there won't be a group visible on the vertical canvas that is not
 * returned here.
 *
 * A significant assumption is that no group is smaller than a single line height.
 *
 * It should be sufficent for the user of the Timeline to only load item data for the groups
 * returned here. It would be possible (even easier) to return only the groups that are actually
 * on the canvas. However that would change more often as loading a new set of items (or even
 * just interacting with one) make some groups larger or smaller when they stack.
 *
 * @param {{id: *}[]} groups  All of the groups of the Timeline.
 * @param {number[]} groupTops  The calculated top position for each group in pixels.
 * @param {number} lineHeight  The height of a single line in pixels.
 * @param {number} canvasTop  The top position of the current vertical canvas in pixels.
 * @param {number} canvasBottom  The bottom position of the current vertical canvas in pixels.
 */
function calculateVisibleGroups<CustomGroup extends TimelineGroupBase>(
    groups: CustomGroup[],
    groupTops: number[],
    lineHeight: number,
    canvasTop: number,
    canvasBottom: number,
) {
    // The previous group may also be partially visible, unless there is no
    // previous group.
    const firstGroupIndex = Math.max(0, findFirstFullyVisibleGroupIndex(groupTops, canvasTop));

    if (firstGroupIndex < 0) {
        // No visible groups at all
        return [];
    }

    const canvasHeight = canvasBottom - canvasTop;
    // Use ceil because a partially visible group is still visible and add 1 because there
    // may be a partial line on both ends.
    const lineCount = Math.ceil(canvasHeight / lineHeight) + 1;
    const lastGroupIndex = Math.min(groups.length - 1, firstGroupIndex + lineCount);

    const visibleGroupIds = Array.from(mapRange(firstGroupIndex, lastGroupIndex + 1, index => groups[index].id));

    return visibleGroupIds;
}

type ReactCalendarTimelineState<CustomGroup extends TimelineGroupBase> = {
    canvasTop: number;
    canvasBottom: number;
    width: number;
    visibleTimeStart: number;
    visibleTimeEnd: number;
    canvasTimeStart: number;
    canvasTimeEnd: number;
    selectedItem: null | Id;
    dragTime: number | null;
    dragGroupTitle: React.ReactNode | null;
    resizeTime: number | null;
    resizingItem: Id | null;
    resizingEdge: TimelineItemEdge | null;

    // Hidden props without initial values (at least in the original implementation)
    dimensionItems: {
        id: Id;
        dimensions: Dimensions<CustomGroup>;
    }[];
    height: number;
    groupHeights: number[];
    groupTops: number[];
    newGroupOrder: number | null;
    draggingItem: Id | null;
};

const defaultSidebarWidth = 150;
const defaultRightSidebarWidth = 0;
const defaultDragSnap = 1000 * 60 * 15; // 15min
const defaultMinResizeWidth = 20;
// const defaultStickyHeader = true;
const defaultLineHeight = 36;
const defaultItemHeight = 28;
const defaultMinZoom = 60 * 60 * 1000; // 1 hour
const defaultMaxZoom = 5 * 365.24 * 86400 * 1000; // 5 years
const defaultClickTolerance = 3; // how many pixels can we drag for it to be still considered a click?
const defaultCanChangeGroup = true;
const defaultCanMove = true;
const defaultCanResize = "right";
const defaultUseResizeHandle = false;
const defaultCanSelect = true;
const defaultStackItems = false;
const defaultItemTouchSendsClick = false;
const defaultStyle: React.CSSProperties = {};
const defaultClassName = "";

const defaultWidthState = 1000;

export default class ReactCalendarTimeline<
    CustomItem extends TimelineItemBase = TimelineItemBase,
    CustomGroup extends TimelineGroupBase = TimelineGroupBase,
> extends Component<ReactCalendarTimelineProps<CustomItem, CustomGroup>, ReactCalendarTimelineState<CustomGroup>> {
    static childContextTypes = {
        getTimelineContext: PropTypes.func,
    };

    getChildContext() {
        return {
            getTimelineContext: () => {
                return this.getTimelineContext();
            },
        };
    }

    getTimelineContext = () => {
        const { width, visibleTimeStart, visibleTimeEnd, canvasTimeStart, canvasTimeEnd } = this.state;

        return {
            timelineWidth: width,
            visibleTimeStart,
            visibleTimeEnd,
            canvasTimeStart,
            canvasTimeEnd,
        };
    };

    private _containerHeight: number;
    private _containerWidth: number;
    private _resizeObserver: ResizeObserver;

    // Keep track of the visible groups (on the canvas)
    private _visibleGroupIds: Id[];

    constructor(props: ReactCalendarTimelineProps<CustomItem, CustomGroup>) {
        super(props);

        this.getSelected = this.getSelected.bind(this);
        this.hasSelectedItem = this.hasSelectedItem.bind(this);
        this.isItemSelected = this.isItemSelected.bind(this);

        // Bind this listener so we can reach the Timeline (and call setState) in it. Without binding,
        // the 'this' inside the function would point directly to the container. Note that we can
        // still reach the container as well if the listener is bound because the Timeline keeps a
        // reference to it.
        this.containerScrollOrResizeListener = this.containerScrollOrResizeListener.bind(this);

        // Keep track of the current height and width of the container.
        this._containerHeight = 0;
        this._containerWidth = 0;
        this._resizeObserver = new ResizeObserver(entries => {
            const { height, width } = entries[0].contentRect;

            if (this._containerHeight !== height) {
                this._containerHeight = height;
                // The height changed, update the vertical scroll canvas
                this.containerScrollOrResizeListener();
            }

            if (this._containerWidth !== width) {
                this._containerWidth = width;
                // The width changed, update the horizontal scroll canvas
                this.resize();
            }
        });

        let visibleTimeStart: null | number = null;
        let visibleTimeEnd: null | number = null;

        if (this.props.defaultTimeStart && this.props.defaultTimeEnd) {
            visibleTimeStart = this.props.defaultTimeStart.valueOf();
            visibleTimeEnd = this.props.defaultTimeEnd.valueOf();
        } else if (this.props.visibleTimeStart && this.props.visibleTimeEnd) {
            visibleTimeStart = this.props.visibleTimeStart;
            visibleTimeEnd = this.props.visibleTimeEnd;
        } else {
            //throwing an error because neither default or visible time props provided
            throw new Error(
                'You must provide either "defaultTimeStart" and "defaultTimeEnd" or "visibleTimeStart" and "visibleTimeEnd" to initialize the Timeline',
            );
        }
        this._visibleGroupIds = [];

        const [canvasTimeStart, canvasTimeEnd] = getCanvasBoundariesFromVisibleTime(visibleTimeStart, visibleTimeEnd);

        const canvasWidth = getCanvasWidth(defaultWidthState); // We can't use state.width here. So let's use the default value.

        const { dimensionItems, height, groupHeights, groupTops } = stackTimelineItems(
            props.items,
            props.groups,
            canvasWidth,
            canvasTimeStart,
            canvasTimeEnd,
            props.lineHeight ?? defaultLineHeight,
            props.itemHeight ?? defaultItemHeight,
            props.stackItems ?? defaultStackItems,
            null, // this.state.draggingItem,
            null, // this.state.resizingItem,
            null, // this.state.dragTime,
            null, // this.state.resizingEdge,
            null, // this.state.resizeTime,
            null, // this.state.newGroupOrder,
        );

        this.state = {
            canvasTop: 0,
            canvasBottom: 500,
            width: defaultWidthState,
            visibleTimeStart: visibleTimeStart,
            visibleTimeEnd: visibleTimeEnd,
            canvasTimeStart: canvasTimeStart,
            canvasTimeEnd: canvasTimeEnd,
            selectedItem: null,
            dragTime: null,
            dragGroupTitle: null,
            resizeTime: null,
            resizingItem: null,
            resizingEdge: null,

            dimensionItems: dimensionItems,
            height: height,
            groupHeights: groupHeights,
            groupTops: groupTops,
            newGroupOrder: null,
            draggingItem: null,
        };
    }

    private _container: HTMLDivElement | null = null;

    /**
     * Event listener that is called when the Timeline container div is scrolled (vertically) or is
     * resized. Checks whether the current vertical canvas still comfortably covers the visible area
     * and sets the new canvas position if it doesn't. Triggers a rerender if and only if a new vertical
     * canvas is needed.
     */
    containerScrollOrResizeListener() {
        if (this._container === null) {
            throw new Error(`This should never happen: the container reference is null`);
        }
        const visibleTop = this._container.scrollTop;
        const visibleHeight = this._containerHeight;

        if (needNewVerticalCanvas(visibleTop, visibleHeight, this.state.canvasTop, this.state.canvasBottom)) {
            const { top, bottom } = getNewVerticalCanvasDimensions(visibleTop, visibleHeight);
            this.setState({ canvasTop: top, canvasBottom: bottom });
        }
    }

    updateVisibleGroupIds() {
        const newVisibleGroupIds = calculateVisibleGroups(
            this.props.groups,
            this.state.groupTops,
            this.props.lineHeight ?? defaultLineHeight,
            this.state.canvasTop,
            this.state.canvasBottom,
        );
        if (!isEqual(this._visibleGroupIds, newVisibleGroupIds)) {
            this._visibleGroupIds = newVisibleGroupIds;
            // The visible groups have changed? Report it!
            if (this.props.onVisibleGroupsChanged) {
                this.props.onVisibleGroupsChanged(this._visibleGroupIds);
            }
        }
    }

    componentDidMount() {
        // The following was never used. It was just set to null after the component mounted. Why???
        // this._lastTouchDistance = null;

        if (this._container === null) {
            throw new Error(`This should never happen: the container reference is null`);
        }

        // Listen for vertical scrolling on the container div.
        this._container.addEventListener("scroll", this.containerScrollOrResizeListener);

        // Starting the observation will call the listeners once. That initial call will
        // set up the initial horizontal and vertical canvas properly.
        this._resizeObserver.observe(this._container);

        this.updateVisibleGroupIds();
    }

    componentWillUnmount() {
        if (this._container === null) {
            throw new Error(`This should never happen: the container reference is null`);
        }
        this._container.removeEventListener("scroll", this.containerScrollOrResizeListener);
        this._resizeObserver.unobserve(this._container);
    }

    static getDerivedStateFromProps<
        CustomItem extends TimelineItemBase = TimelineItemBase,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    >(
        nextProps: Readonly<ReactCalendarTimelineProps<CustomItem, CustomGroup>>,
        prevState: Readonly<ReactCalendarTimelineState<CustomGroup>> & { items?: CustomItem[]; groups?: CustomGroup[] },
    ) {
        const { visibleTimeStart, visibleTimeEnd, items, groups } = nextProps;

        // This is a gross hack pushing items and groups in to state only to allow
        // For the forceUpdate check
        const derivedState = { items, groups };

        // if the items or groups have changed we must re-render
        const forceUpdate = items !== prevState.items || groups !== prevState.groups; // TODO: please check this, I think this never worked

        // We are a controlled component
        if (visibleTimeStart && visibleTimeEnd) {
            // Get the new canvas position
            Object.assign(
                derivedState,
                calculateScrollCanvas(
                    visibleTimeStart,
                    visibleTimeEnd,
                    forceUpdate,
                    items,
                    groups,
                    {
                        // Provide default values
                        lineHeight: defaultLineHeight,
                        itemHeight: defaultItemHeight,
                        stackItems: defaultStackItems,
                        ...nextProps,
                    },
                    prevState,
                ),
            );
        } else if (forceUpdate) {
            // Calculate new item stack position as canvas may have changed
            const canvasWidth = getCanvasWidth(prevState.width);
            Object.assign(
                derivedState,
                stackTimelineItems(
                    items,
                    groups,
                    canvasWidth,
                    prevState.canvasTimeStart,
                    prevState.canvasTimeEnd,
                    nextProps.lineHeight ?? defaultLineHeight,
                    nextProps.itemHeight ?? defaultItemHeight,
                    nextProps.stackItems ?? defaultStackItems,
                    prevState.draggingItem,
                    prevState.resizingItem,
                    prevState.dragTime,
                    prevState.resizingEdge,
                    prevState.resizeTime,
                    prevState.newGroupOrder,
                ),
            );
        }

        return derivedState;
    }

    componentDidUpdate(
        prevProps: Readonly<ReactCalendarTimelineProps<CustomItem, CustomGroup>>,
        prevState: Readonly<ReactCalendarTimelineState<CustomGroup>>,
    ) {
        const newZoom = this.state.visibleTimeEnd - this.state.visibleTimeStart;
        const oldZoom = prevState.visibleTimeEnd - prevState.visibleTimeStart;

        // are we changing zoom? Report it!
        if (this.props.onZoom && newZoom !== oldZoom) {
            this.props.onZoom(this.getTimelineContext());
        }

        // If the group tops have changed but the groups are the same keep the first currently
        // visible group in a fixed scroll position. This prevents the chart from jumping randomly
        // when fresh item data is loaded to the chart.
        if (prevProps.groups === this.props.groups && !isEqual(prevState.groupTops, this.state.groupTops)) {
            if (this._container === null) {
                throw new Error(`This should never happen: the container reference is null`);
            }
            const visibleTop = this._container.scrollTop;
            const prevGroupTops = prevState.groupTops;

            // Find what was the first visible group id in the previous state
            const index = findFirstFullyVisibleGroupIndex(prevGroupTops, visibleTop);

            // Adjust the scroll to keep the first visible group in the same position
            this._container.scrollBy(0, this.state.groupTops[index] - prevGroupTops[index]);
        }

        // The bounds have changed? Report it!
        if (this.props.onBoundsChange && this.state.canvasTimeStart !== prevState.canvasTimeStart) {
            this.props.onBoundsChange(this.state.canvasTimeStart, this.state.canvasTimeStart + newZoom * 3);
        }

        this.updateVisibleGroupIds();

        // Check the scroll is correct
        const scrollLeft = Math.round(
            (this.state.width * (this.state.visibleTimeStart - this.state.canvasTimeStart)) / newZoom,
        );
        const componentScrollLeft = Math.round(
            (prevState.width * (prevState.visibleTimeStart - prevState.canvasTimeStart)) / oldZoom,
        );
        if (componentScrollLeft !== scrollLeft) {
            if (this._scrollComponent === null) {
                throw new Error(`This should never happen: the scroll component is null`);
            }
            if (this._scrollHeaderRef === null) {
                throw new Error(`This should never happen: the scroll header ref is null`);
            }
            this._scrollComponent.scrollLeft = scrollLeft;
            this._scrollHeaderRef.scrollLeft = scrollLeft;
        }
    }

    resize = (props = this.props) => {
        const width =
            this._containerWidth -
            (props.sidebarWidth ?? defaultSidebarWidth) -
            (props.rightSidebarWidth ?? defaultRightSidebarWidth);
        const canvasWidth = getCanvasWidth(width);
        const { dimensionItems, height, groupHeights, groupTops } = stackTimelineItems(
            props.items,
            props.groups,
            canvasWidth,
            this.state.canvasTimeStart,
            this.state.canvasTimeEnd,
            props.lineHeight ?? defaultLineHeight,
            props.itemHeight ?? defaultItemHeight,
            props.stackItems ?? defaultStackItems,
            this.state.draggingItem,
            this.state.resizingItem,
            this.state.dragTime,
            this.state.resizingEdge,
            this.state.resizeTime,
            this.state.newGroupOrder,
        );

        // this is needed by dragItem since it uses pageY from the drag events
        // if this was in the context of the scrollElement, this would not be necessary

        this.setState({
            width,
            dimensionItems,
            height,
            groupHeights,
            groupTops,
        });

        if (this._scrollComponent === null) {
            throw new Error(`This should never happen: the scroll component is null`);
        }
        if (this._scrollHeaderRef === null) {
            throw new Error(`This should never happen: the scroll header ref is null`);
        }

        this._scrollComponent.scrollLeft = width;
        this._scrollHeaderRef.scrollLeft = width;
    };

    onTimeChange = (
        visibleTimeStart: number,
        visibleTimeEnd: number,
        updateScrollCanvas: (start: number, end: number) => void,
    ) => {
        if (this.props.onTimeChange !== undefined) {
            this.props.onTimeChange(visibleTimeStart, visibleTimeEnd, updateScrollCanvas);
        } else {
            // This is the default value when the onTimeChange is empty
            updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
        }
    };

    scrollHorizontally = (scrollX: number) => {
        const visibleDuration = this.state.visibleTimeEnd - this.state.visibleTimeStart;
        const millisecondsPerPixel = visibleDuration / this.state.width;

        const canvasTimeStart = this.state.canvasTimeStart;
        const visibleTimeStart = canvasTimeStart + millisecondsPerPixel * scrollX;

        if (this.state.visibleTimeStart !== visibleTimeStart) {
            this.onTimeChange(visibleTimeStart, visibleTimeStart + visibleDuration, this.updateScrollCanvas);
        }
    };

    scrollVerticallyBy = (deltaY: number) => {
        if (deltaY) {
            this._container?.scrollBy(0, deltaY);
        }
    };

    // called when the visible time changes
    updateScrollCanvas = (
        visibleTimeStart: number,
        visibleTimeEnd: number,
        forceUpdateDimensions = false, // Originally this could be undefined, I use default false instead
        items: CustomItem[] = this.props.items,
        groups: CustomGroup[] = this.props.groups,
    ) => {
        this.setState(
            calculateScrollCanvas(
                visibleTimeStart,
                visibleTimeEnd,
                forceUpdateDimensions,
                items,
                groups,
                {
                    // DON'T FORGET THE DEFAULT VALUES!
                    lineHeight: defaultLineHeight,
                    itemHeight: defaultItemHeight,
                    stackItems: defaultStackItems,
                    ...this.props,
                },
                this.state,
            ) as ReactCalendarTimelineState<CustomGroup>, // TODO: this is ugly, we need to use proper state type in the calculateScrollCanvas
        );
    };

    handleWheelZoom = (speed: number, xPosition: number, deltaY: number) => {
        this.changeZoom(1.0 + (speed * deltaY) / 500, xPosition / this.state.width);
    };

    changeZoom = (scale: number, offset = 0.5) => {
        const { minZoom = defaultMinZoom, maxZoom = defaultMaxZoom } = this.props;
        const oldZoom = this.state.visibleTimeEnd - this.state.visibleTimeStart;
        const newZoom = Math.min(Math.max(Math.round(oldZoom * scale), minZoom), maxZoom); // min 1 min, max 20 years
        const newVisibleTimeStart = Math.round(this.state.visibleTimeStart + (oldZoom - newZoom) * offset);

        this.onTimeChange(newVisibleTimeStart, newVisibleTimeStart + newZoom, this.updateScrollCanvas);
    };

    showPeriod = (from: Moment | number, to: Moment | number) => {
        const visibleTimeStart = from.valueOf();
        const visibleTimeEnd = to.valueOf();

        const zoom = visibleTimeEnd - visibleTimeStart;
        // can't zoom in more than to show one hour
        if (zoom < 360000) {
            return;
        }

        this.onTimeChange(visibleTimeStart, visibleTimeStart + zoom, this.updateScrollCanvas);
    };

    selectItem = (item: Id | null, clickType: ClickType | undefined, e: React.MouseEvent | React.TouchEvent) => {
        if (
            this.isItemSelected(item) ||
            ((this.props.itemTouchSendsClick ?? defaultItemTouchSendsClick) && clickType === "touch")
        ) {
            if (item && this.props.onItemClick) {
                const time = this.timeFromItemEvent(e);
                this.props.onItemClick(item, e, time);
            }
        } else {
            this.setState({ selectedItem: item });
            if (item && this.props.onItemSelect) {
                const time = this.timeFromItemEvent(e);
                this.props.onItemSelect(item, e, time);
            } else if (item === null && this.props.onItemDeselect) {
                this.props.onItemDeselect(e); // this isnt in the docs. Is this function even used?
            }
        }
    };

    doubleClickItem = (item: Id, e: React.MouseEvent) => {
        if (this.props.onItemDoubleClick) {
            const time = this.timeFromItemEvent(e);
            this.props.onItemDoubleClick(item, e, time);
        }
    };

    contextMenuClickItem = (item: Id, e: React.MouseEvent) => {
        if (this.props.onItemContextMenu) {
            const time = this.timeFromItemEvent(e);
            this.props.onItemContextMenu(item, e, time);
        }
    };

    // TODO: this is very similar to timeFromItemEvent, aside from which element to get offsets
    // from.  Look to consolidate the logic for determining coordinate to time
    // as well as generalizing how we get time from click on the canvas
    getTimeFromRowClickEvent = (e: React.MouseEvent<Element, MouseEvent>) => {
        const { dragSnap = defaultDragSnap } = this.props;
        const { width, canvasTimeStart, canvasTimeEnd } = this.state;
        // this gives us distance from left of row element, so event is in
        // context of the row element, not client or page
        const { offsetX } = e.nativeEvent;

        let time = calculateTimeForXPosition(
            canvasTimeStart,

            canvasTimeEnd,
            getCanvasWidth(width),
            offsetX,
        );
        time = Math.floor(time / dragSnap) * dragSnap;

        return time;
    };

    timeFromItemEvent = (e: React.MouseEvent | React.TouchEvent) => {
        const { width, visibleTimeStart, visibleTimeEnd } = this.state;
        const { dragSnap = defaultDragSnap } = this.props;

        if (this._scrollComponent === null) {
            throw new Error(`This should never happen: the scroll component is null`);
        }

        const scrollComponent = this._scrollComponent;
        const { left: scrollX } = scrollComponent.getBoundingClientRect();

        const clientX = "clientX" in e ? e.clientX : 0; // Touch event has no `clientX`. I think in this case we converted the undefined to 0.
        const xRelativeToTimeline = clientX - scrollX;

        const relativeItemPosition = xRelativeToTimeline / width;
        const zoom = visibleTimeEnd - visibleTimeStart;
        const timeOffset = relativeItemPosition * zoom;

        let time = Math.round(visibleTimeStart + timeOffset);
        time = Math.floor(time / dragSnap) * dragSnap;

        return time;
    };

    dragItem = (item: Id, dragTime: number, newGroupOrder: number) => {
        const newGroup = this.props.groups[newGroupOrder];

        this.setState({
            draggingItem: item,
            dragTime: dragTime,
            newGroupOrder: newGroupOrder,
            dragGroupTitle: newGroup ? newGroup.title : "",
        });

        if (this.props.onItemDrag) {
            this.props.onItemDrag({ eventType: "move", itemId: item, time: dragTime, newGroupOrder });
        }
    };

    dropItem = (item: Id, dragTime: number, newGroupOrder: number) => {
        this.setState({ draggingItem: null, dragTime: null, dragGroupTitle: null });
        if (this.props.onItemMove) {
            this.props.onItemMove(item, dragTime, newGroupOrder);
        }
    };

    resizingItem = (item: Id, resizeTime: number, edge: TimelineItemEdge) => {
        this.setState({
            resizingItem: item,
            resizingEdge: edge,
            resizeTime: resizeTime,
        });

        if (this.props.onItemDrag) {
            this.props.onItemDrag({ eventType: "resize", itemId: item, time: resizeTime, edge });
        }
    };

    resizedItem = (item: Id, resizeTime: number, edge: TimelineItemEdge, timeDelta: number) => {
        this.setState({ resizingItem: null, resizingEdge: null, resizeTime: null });
        if (this.props.onItemResize && timeDelta !== 0) {
            this.props.onItemResize(item, resizeTime, edge);
        }
    };

    columns(
        canvasTimeStart: number,
        canvasTimeEnd: number,
        canvasWidth: number,
        minUnit: TimeUnit,
        timeSteps: CompleteTimeSteps,
        height: number,
    ) {
        return (
            <Columns
                canvasTimeStart={canvasTimeStart}
                canvasTimeEnd={canvasTimeEnd}
                canvasWidth={canvasWidth}
                lineCount={this.props.groups.length}
                minUnit={minUnit}
                timeSteps={timeSteps}
                height={height}
                verticalLineClassNamesForTime={this.props.verticalLineClassNamesForTime}
            />
        );
    }

    handleRowClick = (e: React.MouseEvent<Element, MouseEvent>, rowIndex: number) => {
        // shouldnt this be handled by the user, as far as when to deselect an item?
        if (this.hasSelectedItem()) {
            this.selectItem(null, undefined, e); // I added the event param, I have no idea how has this even worked before...
        }

        if (this.props.onCanvasClick === null || this.props.onCanvasClick === undefined) return;

        const time = this.getTimeFromRowClickEvent(e);
        const groupId = this.props.groups[rowIndex].id;
        this.props.onCanvasClick(groupId, time, e);
    };

    handleRowDoubleClick = (e: React.MouseEvent<Element, MouseEvent>, rowIndex: number) => {
        if (this.props.onCanvasDoubleClick === null || this.props.onCanvasDoubleClick === undefined) return;

        const time = this.getTimeFromRowClickEvent(e);
        const groupId = this.props.groups[rowIndex].id;
        this.props.onCanvasDoubleClick(groupId, time, e);
    };

    handleScrollContextMenu = (e: React.MouseEvent<Element, MouseEvent>, rowIndex: number) => {
        if (this.props.onCanvasContextMenu === null) return;

        const timePosition = this.getTimeFromRowClickEvent(e);

        const groupId = this.props.groups[rowIndex].id;

        if (this.props.onCanvasContextMenu) {
            e.preventDefault();
            this.props.onCanvasContextMenu(groupId, timePosition, e);
        }
    };

    handleScrollDrop = (e: React.DragEvent<Element>, rowIndex: number) => {
        if (this.props.onCanvasDrop === undefined) return;

        const time = this.getTimeFromRowClickEvent(e);
        const groupId = this.props.groups[rowIndex].id;
        this.props.onCanvasDrop(groupId, time, e);
    };

    rows(canvasWidth: number, canvasTop: number, canvasBottom: number, groupHeights: number[], groups: CustomGroup[]) {
        return (
            <GroupRows
                groups={groups}
                canvasWidth={canvasWidth}
                canvasTop={canvasTop}
                canvasBottom={canvasBottom}
                lineCount={this.props.groups.length}
                groupHeights={groupHeights}
                clickTolerance={this.props.clickTolerance ?? defaultClickTolerance}
                onRowClick={this.handleRowClick}
                onRowDoubleClick={this.handleRowDoubleClick}
                onRowDrop={this.props.onCanvasDrop !== undefined ? this.handleScrollDrop : undefined}
                horizontalLineClassNamesForGroup={this.props.horizontalLineClassNamesForGroup}
                onRowContextClick={this.handleScrollContextMenu}
            />
        );
    }

    items(
        canvasTimeStart: number,
        canvasTimeEnd: number,
        canvasWidth: number,
        canvasTop: number,
        canvasBottom: number,
        dimensionItems: ItemDimensions<CustomGroup>[],
        groupTops: number[] | undefined,
    ) {
        return (
            <Items
                canvasTimeStart={canvasTimeStart}
                canvasTimeEnd={canvasTimeEnd}
                canvasWidth={canvasWidth}
                canvasTop={canvasTop}
                canvasBottom={canvasBottom}
                dimensionItems={dimensionItems}
                groupTops={groupTops}
                items={this.props.items}
                groups={this.props.groups}
                selectedItem={this.state.selectedItem}
                dragSnap={this.props.dragSnap ?? defaultDragSnap}
                minResizeWidth={this.props.minResizeWidth ?? defaultMinResizeWidth}
                canChangeGroup={this.props.canChangeGroup ?? defaultCanChangeGroup}
                canMove={this.props.canMove ?? defaultCanMove}
                canResize={this.props.canResize ?? defaultCanResize}
                useResizeHandle={this.props.useResizeHandle ?? defaultUseResizeHandle}
                canSelect={this.props.canSelect ?? defaultCanSelect}
                moveResizeValidator={this.props.moveResizeValidator}
                itemSelect={this.selectItem}
                itemDrag={this.dragItem}
                itemDrop={this.dropItem}
                onItemDoubleClick={this.doubleClickItem}
                onItemContextMenu={this.contextMenuClickItem}
                itemResizing={this.resizingItem}
                itemResized={this.resizedItem}
                itemRenderer={this.props.itemRenderer}
                selected={this.props.selected}
                scrollRef={this._scrollComponent}
            />
        );
    }

    private _scrollHeaderRef: HTMLElement | null = null;

    handleHeaderRef = (el: HTMLElement | null) => {
        this._scrollHeaderRef = el;
        if (this.props.headerRef) {
            this.props.headerRef(el);
        }
    };

    sidebar(groupHeights: number[], canvasTop: number, canvasBottom: number) {
        const { sidebarWidth = defaultSidebarWidth } = this.props;
        return (
            sidebarWidth && (
                <Sidebar
                    groups={this.props.groups}
                    groupRenderer={this.props.groupRenderer}
                    width={sidebarWidth}
                    groupHeights={groupHeights}
                    canvasTop={canvasTop}
                    canvasBottom={canvasBottom}
                />
            )
        );
    }

    rightSidebar(groupHeights: number[], canvasTop: number, canvasBottom: number) {
        const { rightSidebarWidth = defaultRightSidebarWidth } = this.props;
        return (
            rightSidebarWidth && (
                <Sidebar
                    groups={this.props.groups}
                    groupRenderer={this.props.groupRenderer}
                    isRightSidebar
                    width={rightSidebarWidth}
                    groupHeights={groupHeights}
                    canvasTop={canvasTop}
                    canvasBottom={canvasBottom}
                />
            )
        );
    }

    /**
     * check if child of type TimelineHeader
     * refer to for explanation https://github.com/gaearon/react-hot-loader#checking-element-types
     */
    isTimelineHeader = (child: ReactNodeWithPossibleTypeAndSecretKey) => {
        if (child.type === undefined) return false;
        return child.type.secretKey === TimelineHeaders.secretKey;
    };

    childrenWithProps(
        canvasTimeStart: number,
        canvasTimeEnd: number,
        canvasWidth: number,
        dimensionItems: {
            id: Id;
            dimensions: Dimensions<CustomGroup>;
        }[],
        groupHeights: number[],
        groupTops: number[],
        height: number,
        visibleTimeStart: number | Date | Moment,
        visibleTimeEnd: number | Date | Moment,
        minUnit: TimeUnit,
        timeSteps: ITimeSteps | undefined,
    ) {
        if (!this.props.children) {
            return null;
        }

        // convert to an array and remove the nulls
        const childArray = Array.isArray(this.props.children)
            ? this.props.children.filter(c => c)
            : [this.props.children];

        const childProps = {
            canvasTimeStart,
            canvasTimeEnd,
            canvasWidth,
            visibleTimeStart: visibleTimeStart,
            visibleTimeEnd: visibleTimeEnd,
            dimensionItems,
            items: this.props.items,
            groups: this.props.groups,
            groupHeights: groupHeights,
            groupTops: groupTops,
            selected: this.getSelected(),
            height: height,
            minUnit: minUnit,
            timeSteps: timeSteps,
        };

        return React.Children.map(childArray, (child: ReactElementWithPossibleTypeAndSecretKey) => {
            if (!this.isTimelineHeader(child)) {
                return React.cloneElement(child, childProps);
            } else {
                return null;
            }
        });
    }

    renderHeaders = () => {
        if (this.props.children) {
            let headerRenderer;
            React.Children.map(this.props.children, (child: ReactNodeWithPossibleTypeAndSecretKey) => {
                if (this.isTimelineHeader(child)) {
                    headerRenderer = child;
                }
            });
            if (headerRenderer) {
                return headerRenderer;
            }
        }
        return (
            <TimelineHeaders>
                <DateHeader unit="primaryHeader" />
                <DateHeader />
            </TimelineHeaders>
        );
    };

    getSelected() {
        return this.state.selectedItem && !this.props.selected ? [this.state.selectedItem] : this.props.selected || [];
    }

    hasSelectedItem() {
        if (!Array.isArray(this.props.selected)) return !!this.state.selectedItem;
        return this.props.selected.length > 0;
    }

    isItemSelected(itemId: Id | null) {
        const selectedItems = this.getSelected();
        return selectedItems.some(i => i === itemId);
    }

    private _scrollComponent: HTMLDivElement | null = null;

    getScrollElementRef: React.RefCallback<HTMLDivElement> = (el: HTMLDivElement) => {
        if (this.props.scrollRef) {
            this.props.scrollRef(el);
        }
        this._scrollComponent = el;
    };

    render() {
        // We need a complete time steps, partial is not enough, so the missing parts will be overwritten
        const timeSteps: CompleteTimeSteps = { ...defaultTimeSteps, ...this.props.timeSteps };
        const {
            items,
            groups,
            sidebarWidth = defaultSidebarWidth,
            rightSidebarWidth = defaultRightSidebarWidth,
        } = this.props;
        const {
            draggingItem,
            resizingItem,
            width,
            visibleTimeStart,
            visibleTimeEnd,
            canvasTimeStart,
            canvasTimeEnd,
            canvasTop,
            canvasBottom,
        } = this.state;
        let { dimensionItems, height, groupHeights, groupTops } = this.state;

        const zoom = visibleTimeEnd - visibleTimeStart;
        const canvasWidth = getCanvasWidth(width);
        const canvasHeight = canvasBottom - canvasTop;
        const minUnit = getMinUnit(zoom, width, timeSteps);

        const isInteractingWithItem = !!draggingItem || !!resizingItem;

        if (isInteractingWithItem) {
            const stackResults = stackTimelineItems(
                items,
                groups,
                canvasWidth,
                this.state.canvasTimeStart,
                this.state.canvasTimeEnd,
                this.props.lineHeight ?? defaultLineHeight,
                this.props.itemHeight ?? defaultItemHeight,
                this.props.stackItems ?? defaultStackItems,
                this.state.draggingItem,
                this.state.resizingItem,
                this.state.dragTime,
                this.state.resizingEdge,
                this.state.resizeTime,
                this.state.newGroupOrder,
            );
            dimensionItems = stackResults.dimensionItems;
            height = stackResults.height;
            groupHeights = stackResults.groupHeights;
            groupTops = stackResults.groupTops;
        }

        const outerComponentStyle = {
            height: `${height}px`,
        };

        return (
            <TimelineStateProvider
                visibleTimeStart={visibleTimeStart}
                visibleTimeEnd={visibleTimeEnd}
                canvasTimeStart={canvasTimeStart}
                canvasTimeEnd={canvasTimeEnd}
                canvasWidth={canvasWidth}
                showPeriod={this.showPeriod}
                timelineUnit={minUnit}
                timelineWidth={this.state.width}
            >
                <TimelineMarkersProvider>
                    <TimelineHeadersProvider
                        registerScroll={this.handleHeaderRef}
                        timeSteps={timeSteps}
                        leftSidebarWidth={this.props.sidebarWidth ?? defaultSidebarWidth}
                        rightSidebarWidth={this.props.rightSidebarWidth ?? defaultRightSidebarWidth}
                    >
                        <div
                            style={{ ...defaultContainerStyle, ...(this.props.style ?? defaultStyle) }}
                            ref={el => (this._container = el)}
                            className={`react-calendar-timeline ${this.props.className ?? defaultClassName}`}
                        >
                            {this.renderHeaders()}
                            <div style={outerComponentStyle} className="rct-outer">
                                {sidebarWidth > 0 ? this.sidebar(groupHeights, canvasTop, canvasBottom) : null}
                                <ScrollElement
                                    scrollRef={this.getScrollElementRef}
                                    width={width}
                                    height={canvasHeight}
                                    top={canvasTop}
                                    onZoom={this.changeZoom}
                                    onWheelZoom={this.handleWheelZoom}
                                    onHorizontalScroll={this.scrollHorizontally}
                                    onVerticalScrollBy={this.scrollVerticallyBy}
                                    isInteractingWithItem={isInteractingWithItem}
                                    zoomSpeed={this.props.zoomSpeed}
                                >
                                    <MarkerCanvas>
                                        {this.columns(
                                            canvasTimeStart,
                                            canvasTimeEnd,
                                            canvasWidth,
                                            minUnit,
                                            timeSteps,
                                            canvasHeight,
                                        )}
                                        {this.rows(canvasWidth, canvasTop, canvasBottom, groupHeights, groups)}
                                        {this.items(
                                            canvasTimeStart,
                                            canvasTimeEnd,
                                            canvasWidth,
                                            canvasTop,
                                            canvasBottom,
                                            dimensionItems,
                                            groupTops,
                                        )}
                                        {this.childrenWithProps(
                                            canvasTimeStart,
                                            canvasTimeEnd,
                                            canvasWidth,
                                            dimensionItems,
                                            groupHeights,
                                            groupTops,
                                            height,
                                            visibleTimeStart,
                                            visibleTimeEnd,
                                            minUnit,
                                            timeSteps,
                                        )}
                                    </MarkerCanvas>
                                </ScrollElement>
                                {rightSidebarWidth > 0
                                    ? this.rightSidebar(groupHeights, canvasTop, canvasBottom)
                                    : null}
                            </div>
                        </div>
                    </TimelineHeadersProvider>
                </TimelineMarkersProvider>
            </TimelineStateProvider>
        );
    }
}
