import PropTypes from "prop-types";
import React, { Component } from "react";
import Item from "./Item";
// import ItemGroup from './ItemGroup'

import { arraysEqual, keyBy } from "../utility/generic";
import { getGroupOrders, getVisibleItems } from "../utility/calendar";

const canResizeLeft = (item, canResize) => {
    const value = item.canResize ?? canResize;
    return value === "left" || value === "both";
};

const canResizeRight = (item, canResize) => {
    const value = item.canResize ?? canResize;
    return value === "right" || value === "both" || value === true;
};

export default class Items extends Component {
    static propTypes = {
        groups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
        items: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,

        canvasTimeStart: PropTypes.number.isRequired,
        canvasTimeEnd: PropTypes.number.isRequired,
        canvasWidth: PropTypes.number.isRequired,

        dragSnap: PropTypes.number,
        minResizeWidth: PropTypes.number,
        selectedItem: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

        canChangeGroup: PropTypes.bool.isRequired,
        canMove: PropTypes.bool.isRequired,
        canResize: PropTypes.oneOf([true, false, "left", "right", "both"]),
        canSelect: PropTypes.bool,

        moveResizeValidator: PropTypes.func,
        itemSelect: PropTypes.func,
        itemDrag: PropTypes.func,
        itemDrop: PropTypes.func,
        itemResizing: PropTypes.func,
        itemResized: PropTypes.func,

        onItemDoubleClick: PropTypes.func,
        onItemContextMenu: PropTypes.func,

        itemRenderer: PropTypes.func,
        selected: PropTypes.array,

        dimensionItems: PropTypes.array,
        groupTops: PropTypes.array,
        useResizeHandle: PropTypes.bool,
        scrollRef: PropTypes.object,
    };

    static defaultProps = {
        selected: [],
    };

    shouldComponentUpdate(nextProps) {
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

    isSelected(item) {
        if (!this.props.selected) {
            return this.props.selectedItem === item.id;
        } else {
            return this.props.selected.includes(item.id);
        }
    }

    getVisibleItems(canvasTimeStart, canvasTimeEnd) {
        const { items } = this.props;

        return getVisibleItems(items, canvasTimeStart, canvasTimeEnd);
    }

    render() {
        const { canvasTimeStart, canvasTimeEnd, dimensionItems, groups } = this.props;

        const groupOrders = getGroupOrders(groups);
        const visibleItems = this.getVisibleItems(canvasTimeStart, canvasTimeEnd, groupOrders);
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
