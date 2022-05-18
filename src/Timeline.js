import PropTypes from "prop-types";
import React, { Component } from "react";
import isEqual from "lodash.isequal";
import moment from "moment";

import Items from "./items/Items";
import Sidebar from "./layout/Sidebar";
import Columns from "./columns/Columns";
import { GroupRows } from "./row/GroupRows";
import ScrollElement from "./scroll/ScrollElement";
import MarkerCanvas from "./markers/MarkerCanvas";

import {
    getMinUnit,
    getNextUnit,
    calculateTimeForXPosition,
    calculateScrollCanvas,
    getCanvasBoundariesFromVisibleTime,
    getCanvasWidth,
    stackTimelineItems,
} from "./utility/calendar";
import { defaultTimeSteps, defaultHeaderLabelFormats, defaultSubHeaderLabelFormats } from "./default-config";
import { TimelineStateProvider } from "./timeline/TimelineStateContext";
import { TimelineMarkersProvider } from "./markers/TimelineMarkersContext";
import { TimelineHeadersProvider } from "./headers/HeadersContext";
import TimelineHeaders from "./headers/TimelineHeaders";
import DateHeader from "./headers/DateHeader";
import { mapRange } from "./utility/generators";

/**
 * Default style for the Timeline container div.
 */
const defaultContainerStyle = { height: "100%", overflowY: "auto" };

/**
 * Calculates new vertical canvas dimensions to comfortably cover the visible area.
 *
 * @param {number} visibleTop  The Y coordinate at the top of the visible part in pixels.
 * @param {number} visibleHeight  The Y coordinate at the bottom of the visible part in pixels.
 *
 * @returns  The top and the bottom of the new canvas in pixels.
 */
function getNewVerticalCanvasDimensions(visibleTop, visibleHeight) {
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
function needNewVerticalCanvas(visibleTop, visibleHeight, canvasTop, canvasBottom) {
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
function calculateVisibleGroups(groups, groupTops, lineHeight, canvasTop, canvasBottom) {
    let firstGroupIndex = -1;

    // Find the first visible group.
    // TODO: We could use a binary search here for more performance.
    for (let i = 0; i < groupTops.length; i++) {
        if (groupTops[i] > canvasTop) {
            // The previous group is also partially visible, unless there is no
            // previous group.
            firstGroupIndex = Math.max(0, i - 1);
            break;
        }
    }

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

export default class ReactCalendarTimeline extends Component {
    static propTypes = {
        groups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
        items: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
        sidebarWidth: PropTypes.number,
        rightSidebarWidth: PropTypes.number,
        dragSnap: PropTypes.number,
        minResizeWidth: PropTypes.number,
        stickyHeader: PropTypes.bool,
        lineHeight: PropTypes.number,
        itemHeightRatio: PropTypes.number,

        minZoom: PropTypes.number,
        maxZoom: PropTypes.number,

        clickTolerance: PropTypes.number,

        canChangeGroup: PropTypes.bool,
        canMove: PropTypes.bool,
        canResize: PropTypes.oneOf([true, false, "left", "right", "both"]),
        useResizeHandle: PropTypes.bool,
        canSelect: PropTypes.bool,

        stackItems: PropTypes.bool,

        itemTouchSendsClick: PropTypes.bool,

        horizontalLineClassNamesForGroup: PropTypes.func,

        onItemMove: PropTypes.func,
        onItemResize: PropTypes.func,
        onItemClick: PropTypes.func,
        onItemSelect: PropTypes.func,
        onItemDeselect: PropTypes.func,
        onCanvasClick: PropTypes.func,
        onItemDoubleClick: PropTypes.func,
        onItemContextMenu: PropTypes.func,
        onCanvasContextMenu: PropTypes.func,
        onCanvasDoubleClick: PropTypes.func,
        onCanvasDrop: PropTypes.func,
        onZoom: PropTypes.func,
        onItemDrag: PropTypes.func,

        moveResizeValidator: PropTypes.func,

        itemRenderer: PropTypes.func,
        groupRenderer: PropTypes.func,

        className: PropTypes.string,
        style: PropTypes.object,

        headerRef: PropTypes.func,
        scrollRef: PropTypes.func,

        timeSteps: PropTypes.shape({
            second: PropTypes.number,
            minute: PropTypes.number,
            hour: PropTypes.number,
            day: PropTypes.number,
            month: PropTypes.number,
            year: PropTypes.number,
        }),

        defaultTimeStart: PropTypes.object,
        defaultTimeEnd: PropTypes.object,

        visibleTimeStart: PropTypes.number,
        visibleTimeEnd: PropTypes.number,
        onTimeChange: PropTypes.func,
        onBoundsChange: PropTypes.func,
        onVisibleGroupsChanged: PropTypes.func,

        selected: PropTypes.array,

        headerLabelFormats: PropTypes.shape({
            yearShort: PropTypes.string,
            yearLong: PropTypes.string,
            monthShort: PropTypes.string,
            monthMedium: PropTypes.string,
            monthMediumLong: PropTypes.string,
            monthLong: PropTypes.string,
            dayShort: PropTypes.string,
            dayLong: PropTypes.string,
            hourShort: PropTypes.string,
            hourMedium: PropTypes.string,
            hourMediumLong: PropTypes.string,
            hourLong: PropTypes.string,
        }),

        subHeaderLabelFormats: PropTypes.shape({
            yearShort: PropTypes.string,
            yearLong: PropTypes.string,
            monthShort: PropTypes.string,
            monthMedium: PropTypes.string,
            monthLong: PropTypes.string,
            dayShort: PropTypes.string,
            dayMedium: PropTypes.string,
            dayMediumLong: PropTypes.string,
            dayLong: PropTypes.string,
            hourShort: PropTypes.string,
            hourLong: PropTypes.string,
            minuteShort: PropTypes.string,
            minuteLong: PropTypes.string,
        }),

        verticalLineClassNamesForTime: PropTypes.func,

        zoomSpeed: PropTypes.object,

        children: PropTypes.node,
    };

    static defaultProps = {
        sidebarWidth: 150,
        rightSidebarWidth: 0,
        dragSnap: 1000 * 60 * 15, // 15min
        minResizeWidth: 20,
        stickyHeader: true,
        lineHeight: 30,
        itemHeightRatio: 0.65,

        minZoom: 60 * 60 * 1000, // 1 hour
        maxZoom: 5 * 365.24 * 86400 * 1000, // 5 years

        clickTolerance: 3, // how many pixels can we drag for it to be still considered a click?

        canChangeGroup: true,
        canMove: true,
        canResize: "right",
        useResizeHandle: false,
        canSelect: true,

        stackItems: false,

        horizontalLineClassNamesForGroup: undefined,

        onItemMove: null,
        onItemResize: null,
        onItemClick: null,
        onItemSelect: null,
        onItemDeselect: null,
        onItemDrag: null,
        onCanvasClick: null,
        onItemDoubleClick: null,
        onItemContextMenu: null,
        onZoom: null,

        verticalLineClassNamesForTime: null,

        moveResizeValidator: null,

        dayBackground: null,

        defaultTimeStart: null,
        defaultTimeEnd: null,

        itemTouchSendsClick: false,

        style: {},
        className: "",
        timeSteps: defaultTimeSteps,
        headerRef: () => {},
        scrollRef: () => {},

        // if you pass in visibleTimeStart and visibleTimeEnd, you must also pass onTimeChange(visibleTimeStart, visibleTimeEnd),
        // which needs to update the props visibleTimeStart and visibleTimeEnd to the ones passed
        visibleTimeStart: null,
        visibleTimeEnd: null,
        onTimeChange: function (visibleTimeStart, visibleTimeEnd, updateScrollCanvas) {
            updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
        },
        // called when the canvas area of the calendar changes
        onBoundsChange: null,
        children: null,

        headerLabelFormats: defaultHeaderLabelFormats,
        subHeaderLabelFormats: defaultSubHeaderLabelFormats,

        selected: null,
    };

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

    constructor(props) {
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
        this.containerHeight = 0;
        this.containerWidth = 0;
        this.resizeObserver = new ResizeObserver(entries => {
            const { height, width } = entries[0].contentRect;

            if (this.containerHeight !== height) {
                this.containerHeight = height;
                // The height changed, update the vertical scroll canvas
                this.containerScrollOrResizeListener();
            }

            if (this.containerWidth !== width) {
                this.containerWidth = width;
                // The width changed, update the horizontal scroll canvas
                this.resize();
            }
        });

        let visibleTimeStart = null;
        let visibleTimeEnd = null;

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

        // Keep track of the visible groups (on the canvas)
        this.visibleGroupIds = [];

        const [canvasTimeStart, canvasTimeEnd] = getCanvasBoundariesFromVisibleTime(visibleTimeStart, visibleTimeEnd);

        this.state = {
            canvasTop: 0,
            canvasBottom: 500,
            width: 1000,
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
        };

        const canvasWidth = getCanvasWidth(this.state.width);

        const { dimensionItems, height, groupHeights, groupTops } = stackTimelineItems(
            props.items,
            props.groups,
            canvasWidth,
            this.state.canvasTimeStart,
            this.state.canvasTimeEnd,
            props.lineHeight,
            props.itemHeightRatio,
            props.stackItems,
            this.state.draggingItem,
            this.state.resizingItem,
            this.state.dragTime,
            this.state.resizingEdge,
            this.state.resizeTime,
            this.state.newGroupOrder,
        );

        /* eslint-disable react/no-direct-mutation-state */
        this.state.dimensionItems = dimensionItems;
        this.state.height = height;
        this.state.groupHeights = groupHeights;
        this.state.groupTops = groupTops;

        /* eslint-enable */
    }

    /**
     * Event listener that is called when the Timeline container div is scrolled (vertically) or is
     * resized. Checks whether the current vertical canvas still comfortably covers the visible area
     * and sets the new canvas position if it doesn't. Triggers a rerender if and only if a new vertical
     * canvas is needed.
     */
    containerScrollOrResizeListener() {
        const visibleTop = this.container.scrollTop;
        const visibleHeight = this.containerHeight;

        if (needNewVerticalCanvas(visibleTop, visibleHeight, this.state.canvasTop, this.state.canvasBottom)) {
            const { top, bottom } = getNewVerticalCanvasDimensions(visibleTop, visibleHeight);
            this.setState({ canvasTop: top, canvasBottom: bottom });
        }
    }

    updateVisibleGroupIds() {
        const newVisibleGroupIds = calculateVisibleGroups(
            this.props.groups,
            this.state.groupTops,
            this.props.lineHeight,
            this.state.canvasTop,
            this.state.canvasBottom,
        );
        if (!isEqual(this.visibleGroupIds, newVisibleGroupIds)) {
            this.visibleGroupIds = newVisibleGroupIds;
            // The visible groups have changed? Report it!
            if (this.props.onVisibleGroupsChanged) {
                this.props.onVisibleGroupsChanged(this.visibleGroupIds);
            }
        }
    }

    componentDidMount() {
        this.lastTouchDistance = null;

        // Listen for vertical scrolling on the container div.
        this.container.addEventListener("scroll", this.containerScrollOrResizeListener);

        // Starting the observation will call the listeners once. That initial call will
        // set up the initial horizontal and vertical canvas properly.
        this.resizeObserver.observe(this.container);

        this.updateVisibleGroupIds();
    }

    componentWillUnmount() {
        this.container.removeEventListener("scroll", this.containerScrollOrResizeListener);
        this.resizeObserver.unobserve(this.container);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const { visibleTimeStart, visibleTimeEnd, items, groups } = nextProps;

        // This is a gross hack pushing items and groups in to state only to allow
        // For the forceUpdate check
        let derivedState = { items, groups };

        // if the items or groups have changed we must re-render
        const forceUpdate = items !== prevState.items || groups !== prevState.groups;

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
                    nextProps,
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
                    nextProps.lineHeight,
                    nextProps.itemHeightRatio,
                    nextProps.stackItems,
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

    componentDidUpdate(prevProps, prevState) {
        const newZoom = this.state.visibleTimeEnd - this.state.visibleTimeStart;
        const oldZoom = prevState.visibleTimeEnd - prevState.visibleTimeStart;

        // are we changing zoom? Report it!
        if (this.props.onZoom && newZoom !== oldZoom) {
            this.props.onZoom(this.getTimelineContext());
        }

        // If the group tops have changed but the groups are the same keep the first currently
        // visible group in a fixed scroll position. This prevents the chart from jumping randomly
        // when fresh item data is loaded to the chart.
        if (isEqual(prevProps.groups, this.props.groups) && !isEqual(prevState.groupTops, this.state.groupTops)) {
            const visibleTop = this.container.scrollTop;
            const prevGroupTops = prevState.groupTops;

            // Find what was the first visible group id in the previous state
            for (let i = 0; i < prevGroupTops.length; i++) {
                if (prevGroupTops[i] >= visibleTop) {
                    // Adjust the scroll to keep the first visible group in the same position
                    this.container.scrollBy(0, this.state.groupTops[i] - prevGroupTops[i]);
                    break;
                }
            }
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
            this.scrollComponent.scrollLeft = scrollLeft;
            this.scrollHeaderRef.scrollLeft = scrollLeft;
        }
    }

    resize = (props = this.props) => {
        let width = this.containerWidth - props.sidebarWidth - props.rightSidebarWidth;
        const canvasWidth = getCanvasWidth(width);
        const { dimensionItems, height, groupHeights, groupTops } = stackTimelineItems(
            props.items,
            props.groups,
            canvasWidth,
            this.state.canvasTimeStart,
            this.state.canvasTimeEnd,
            props.lineHeight,
            props.itemHeightRatio,
            props.stackItems,
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

        this.scrollComponent.scrollLeft = width;
        this.scrollHeaderRef.scrollLeft = width;
    };

    scrollHorizontally = scrollX => {
        const visibleDuration = this.state.visibleTimeEnd - this.state.visibleTimeStart;
        const millisecondsPerPixel = visibleDuration / this.state.width;

        const canvasTimeStart = this.state.canvasTimeStart;
        const visibleTimeStart = canvasTimeStart + millisecondsPerPixel * scrollX;

        if (this.state.visibleTimeStart !== visibleTimeStart) {
            this.props.onTimeChange(visibleTimeStart, visibleTimeStart + visibleDuration, this.updateScrollCanvas);
        }
    };

    scrollVerticallyBy = deltaY => {
        if (deltaY) {
            this.container?.scrollBy(0, deltaY);
        }
    };

    // called when the visible time changes
    updateScrollCanvas = (
        visibleTimeStart,
        visibleTimeEnd,
        forceUpdateDimensions,
        items = this.props.items,
        groups = this.props.groups,
    ) => {
        this.setState(
            calculateScrollCanvas(
                visibleTimeStart,
                visibleTimeEnd,
                forceUpdateDimensions,
                items,
                groups,
                this.props,
                this.state,
            ),
        );
    };

    handleWheelZoom = (speed, xPosition, deltaY) => {
        this.changeZoom(1.0 + (speed * deltaY) / 500, xPosition / this.state.width);
    };

    changeZoom = (scale, offset = 0.5) => {
        const { minZoom, maxZoom } = this.props;
        const oldZoom = this.state.visibleTimeEnd - this.state.visibleTimeStart;
        const newZoom = Math.min(Math.max(Math.round(oldZoom * scale), minZoom), maxZoom); // min 1 min, max 20 years
        const newVisibleTimeStart = Math.round(this.state.visibleTimeStart + (oldZoom - newZoom) * offset);

        this.props.onTimeChange(newVisibleTimeStart, newVisibleTimeStart + newZoom, this.updateScrollCanvas);
    };

    showPeriod = (from, to) => {
        let visibleTimeStart = from.valueOf();
        let visibleTimeEnd = to.valueOf();

        let zoom = visibleTimeEnd - visibleTimeStart;
        // can't zoom in more than to show one hour
        if (zoom < 360000) {
            return;
        }

        this.props.onTimeChange(visibleTimeStart, visibleTimeStart + zoom, this.updateScrollCanvas);
    };

    selectItem = (item, clickType, e) => {
        if (this.isItemSelected(item) || (this.props.itemTouchSendsClick && clickType === "touch")) {
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

    doubleClickItem = (item, e) => {
        if (this.props.onItemDoubleClick) {
            const time = this.timeFromItemEvent(e);
            this.props.onItemDoubleClick(item, e, time);
        }
    };

    contextMenuClickItem = (item, e) => {
        if (this.props.onItemContextMenu) {
            const time = this.timeFromItemEvent(e);
            this.props.onItemContextMenu(item, e, time);
        }
    };

    // TODO: this is very similar to timeFromItemEvent, aside from which element to get offsets
    // from.  Look to consolidate the logic for determining coordinate to time
    // as well as generalizing how we get time from click on the canvas
    getTimeFromRowClickEvent = e => {
        const { dragSnap } = this.props;
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

    timeFromItemEvent = e => {
        const { width, visibleTimeStart, visibleTimeEnd } = this.state;
        const { dragSnap } = this.props;

        const scrollComponent = this.scrollComponent;
        const { left: scrollX } = scrollComponent.getBoundingClientRect();

        const xRelativeToTimeline = e.clientX - scrollX;

        const relativeItemPosition = xRelativeToTimeline / width;
        const zoom = visibleTimeEnd - visibleTimeStart;
        const timeOffset = relativeItemPosition * zoom;

        let time = Math.round(visibleTimeStart + timeOffset);
        time = Math.floor(time / dragSnap) * dragSnap;

        return time;
    };

    dragItem = (item, dragTime, newGroupOrder) => {
        let newGroup = this.props.groups[newGroupOrder];

        this.setState({
            draggingItem: item,
            dragTime: dragTime,
            newGroupOrder: newGroupOrder,
            dragGroupTitle: newGroup ? newGroup.title : "",
        });

        this.updatingItem({
            eventType: "move",
            itemId: item,
            time: dragTime,
            newGroupOrder,
        });
    };

    dropItem = (item, dragTime, newGroupOrder) => {
        this.setState({ draggingItem: null, dragTime: null, dragGroupTitle: null });
        if (this.props.onItemMove) {
            this.props.onItemMove(item, dragTime, newGroupOrder);
        }
    };

    resizingItem = (item, resizeTime, edge) => {
        this.setState({
            resizingItem: item,
            resizingEdge: edge,
            resizeTime: resizeTime,
        });

        this.updatingItem({
            eventType: "resize",
            itemId: item,
            time: resizeTime,
            edge,
        });
    };

    resizedItem = (item, resizeTime, edge, timeDelta) => {
        this.setState({ resizingItem: null, resizingEdge: null, resizeTime: null });
        if (this.props.onItemResize && timeDelta !== 0) {
            this.props.onItemResize(item, resizeTime, edge);
        }
    };

    updatingItem = ({ eventType, itemId, time, edge, newGroupOrder }) => {
        if (this.props.onItemDrag) {
            this.props.onItemDrag({ eventType, itemId, time, edge, newGroupOrder });
        }
    };

    columns(canvasTimeStart, canvasTimeEnd, canvasWidth, minUnit, timeSteps, height) {
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

    handleRowClick = (e, rowIndex) => {
        // shouldnt this be handled by the user, as far as when to deselect an item?
        if (this.hasSelectedItem()) {
            this.selectItem(null);
        }

        if (this.props.onCanvasClick == null) return;

        const time = this.getTimeFromRowClickEvent(e);
        const groupId = this.props.groups[rowIndex].id;
        this.props.onCanvasClick(groupId, time, e);
    };

    handleRowDoubleClick = (e, rowIndex) => {
        if (this.props.onCanvasDoubleClick == null) return;

        const time = this.getTimeFromRowClickEvent(e);
        const groupId = this.props.groups[rowIndex].id;
        this.props.onCanvasDoubleClick(groupId, time, e);
    };

    handleScrollContextMenu = (e, rowIndex) => {
        if (this.props.onCanvasContextMenu == null) return;

        const timePosition = this.getTimeFromRowClickEvent(e);

        const groupId = this.props.groups[rowIndex].id;

        if (this.props.onCanvasContextMenu) {
            e.preventDefault();
            this.props.onCanvasContextMenu(groupId, timePosition, e);
        }
    };

    handleScrollDrop = (e, rowIndex) => {
        if (this.props.onCanvasDrop === undefined) return;

        const time = this.getTimeFromRowClickEvent(e);
        const groupId = this.props.groups[rowIndex].id;
        this.props.onCanvasDrop(groupId, time, e);
    };

    rows(canvasWidth, canvasTop, canvasBottom, groupHeights, groups) {
        return (
            <GroupRows
                groups={groups}
                canvasWidth={canvasWidth}
                canvasTop={canvasTop}
                canvasBottom={canvasBottom}
                lineCount={this.props.groups.length}
                groupHeights={groupHeights}
                clickTolerance={this.props.clickTolerance}
                onRowClick={this.handleRowClick}
                onRowDoubleClick={this.handleRowDoubleClick}
                onRowDrop={this.props.onCanvasDrop !== undefined ? this.handleScrollDrop : undefined}
                horizontalLineClassNamesForGroup={this.props.horizontalLineClassNamesForGroup}
                onRowContextClick={this.handleScrollContextMenu}
            />
        );
    }

    items(
        canvasTimeStart,
        zoom,
        canvasTimeEnd,
        canvasWidth,
        canvasTop,
        canvasBottom,
        minUnit,
        dimensionItems,
        groupHeights,
        groupTops,
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
                dragSnap={this.props.dragSnap}
                minResizeWidth={this.props.minResizeWidth}
                canChangeGroup={this.props.canChangeGroup}
                canMove={this.props.canMove}
                canResize={this.props.canResize}
                useResizeHandle={this.props.useResizeHandle}
                canSelect={this.props.canSelect}
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
                scrollRef={this.scrollComponent}
            />
        );
    }

    handleHeaderRef = el => {
        this.scrollHeaderRef = el;
        this.props.headerRef(el);
    };

    sidebar(groupHeights, canvasTop, canvasBottom) {
        const { sidebarWidth } = this.props;
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

    rightSidebar(groupHeights, canvasTop, canvasBottom) {
        const { rightSidebarWidth } = this.props;
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
    isTimelineHeader = child => {
        if (child.type === undefined) return false;
        return child.type.secretKey === TimelineHeaders.secretKey;
    };

    childrenWithProps(
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

        return React.Children.map(childArray, child => {
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
            React.Children.map(this.props.children, child => {
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

    isItemSelected(itemId) {
        const selectedItems = this.getSelected();
        return selectedItems.some(i => i === itemId);
    }
    getScrollElementRef = el => {
        this.props.scrollRef(el);
        this.scrollComponent = el;
    };

    render() {
        const { items, groups, sidebarWidth, rightSidebarWidth, timeSteps } = this.props;
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
                this.props.lineHeight,
                this.props.itemHeightRatio,
                this.props.stackItems,
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
                        leftSidebarWidth={this.props.sidebarWidth}
                        rightSidebarWidth={this.props.rightSidebarWidth}
                    >
                        <div
                            style={{ ...defaultContainerStyle, ...this.props.style }}
                            ref={el => (this.container = el)}
                            className={`react-calendar-timeline ${this.props.className}`}
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
                                            zoom,
                                            canvasTimeEnd,
                                            canvasWidth,
                                            canvasTop,
                                            canvasBottom,
                                            minUnit,
                                            dimensionItems,
                                            groupHeights,
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
