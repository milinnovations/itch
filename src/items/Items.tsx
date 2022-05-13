import React, { Component } from "react";

import Item from "./Item";
import type {
    ClickType,
    Id,
    MoveResizeValidator,
    ReactCalendarItemRendererProps,
    ResizeOptions,
    TimelineGroupBase,
    TimelineItemBase,
    TimelineItemEdge,
} from "../types";
import { arraysEqual, keyBy } from "../utility/generic";
import { getGroupOrders, getVisibleItems } from "../utility/calendar";
import type { ItemDimensions } from "../utility/calendar";

const canResizeLeft = (item: TimelineItemBase, canResize: ResizeOptions | undefined) => {
    const value = item.canResize ?? canResize;
    return value === "left" || value === "both";
};

const canResizeRight = (item: TimelineItemBase, canResize: ResizeOptions | undefined) => {
    const value = item.canResize ?? canResize;
    return value === "right" || value === "both" || value === true;
};

type Props<TGroup extends TimelineGroupBase, TItem extends TimelineItemBase> = {
    groups: TGroup[];
    items: TItem[];
    dimensionItems: ItemDimensions<TGroup>[];

    canvasTimeStart: number;
    canvasTimeEnd: number;
    canvasWidth: number;

    groupTops?: number[];

    dragSnap?: number;
    minResizeWidth?: number;
    selectedItem?: Id | null;
    selected?: Id[] | null;

    canChangeGroup: boolean;
    canMove: boolean;
    canResize?: ResizeOptions;
    canSelect?: boolean;
    useResizeHandle?: boolean;

    moveResizeValidator?: MoveResizeValidator;
    itemSelect?: (item: Id, clickType: ClickType, event: React.MouseEvent | React.TouchEvent) => void;
    itemDrag?: (item: Id, dragTime: number, newGroup: Id) => void;
    itemDrop?: (item: Id, dragTime: number, newGroup: Id) => void;
    itemResizing?: (item: Id, resizeTime: number, edge: TimelineItemEdge) => void;
    itemResized?: (item: Id, resizeTime: number, edge: TimelineItemEdge, timeDelta: number) => void;

    onItemDoubleClick?: (item: Id, event: React.MouseEvent) => void;
    onItemContextMenu?: (item: Id, event: React.MouseEvent) => void;

    itemRenderer?: (props: ReactCalendarItemRendererProps<TItem>) => React.ReactNode;
    scrollRef?: React.Ref<HTMLDivElement>;
};

export default class Items<TGroup extends TimelineGroupBase, TItem extends TimelineItemBase> extends Component<
    Props<TGroup, TItem>
> {
    shouldComponentUpdate(nextProps: Props<TGroup, TItem>) {
        return !(
            arraysEqual(nextProps.groups, this.props.groups) &&
            arraysEqual(nextProps.items, this.props.items) &&
            arraysEqual(nextProps.dimensionItems, this.props.dimensionItems) &&
            nextProps.canvasTimeStart === this.props.canvasTimeStart &&
            nextProps.canvasTimeEnd === this.props.canvasTimeEnd &&
            nextProps.canvasWidth === this.props.canvasWidth &&
            nextProps.selectedItem === this.props.selectedItem &&
            nextProps.selected === this.props.selected &&
            nextProps.dragSnap === this.props.dragSnap &&
            nextProps.minResizeWidth === this.props.minResizeWidth &&
            nextProps.canChangeGroup === this.props.canChangeGroup &&
            nextProps.canMove === this.props.canMove &&
            nextProps.canResize === this.props.canResize &&
            nextProps.canSelect === this.props.canSelect
        );
    }

    isSelected(item: TimelineItemBase) {
        if (!this.props.selected) {
            return this.props.selectedItem === item.id;
        } else {
            return this.props.selected.includes(item.id);
        }
    }

    render() {
        const { canvasTimeStart, canvasTimeEnd, dimensionItems, groups, items } = this.props;

        const groupOrders = getGroupOrders(groups);
        const visibleItems = getVisibleItems(items, canvasTimeStart, canvasTimeEnd);
        const sortedDimensionItems = keyBy(dimensionItems, item => item.id);

        return (
            <div className="rct-items">
                {visibleItems
                    .filter(item => sortedDimensionItems[item.id])
                    .map(item => (
                        <Item
                            key={item.id}
                            item={item}
                            order={groupOrders[item.group]}
                            dimensions={sortedDimensionItems[item.id].dimensions}
                            selected={this.isSelected(item)}
                            canChangeGroup={
                                item.canChangeGroup !== undefined ? item.canChangeGroup : this.props.canChangeGroup
                            }
                            canMove={item.canMove !== undefined ? item.canMove : this.props.canMove}
                            canResizeLeft={canResizeLeft(item, this.props.canResize)}
                            canResizeRight={canResizeRight(item, this.props.canResize)}
                            canSelect={item.canSelect !== undefined ? item.canSelect : this.props.canSelect}
                            useResizeHandle={this.props.useResizeHandle}
                            groupTops={this.props.groupTops}
                            canvasTimeStart={this.props.canvasTimeStart}
                            canvasTimeEnd={this.props.canvasTimeEnd}
                            canvasWidth={this.props.canvasWidth}
                            dragSnap={this.props.dragSnap}
                            minResizeWidth={this.props.minResizeWidth}
                            onResizing={this.props.itemResizing}
                            onResized={this.props.itemResized}
                            moveResizeValidator={this.props.moveResizeValidator}
                            onDrag={this.props.itemDrag}
                            onDrop={this.props.itemDrop}
                            onItemDoubleClick={this.props.onItemDoubleClick}
                            onContextMenu={this.props.onItemContextMenu}
                            onSelect={this.props.itemSelect}
                            itemRenderer={this.props.itemRenderer}
                            scrollRef={this.props.scrollRef}
                        />
                    ))}
            </div>
        );
    }
}
