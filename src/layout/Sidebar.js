import PropTypes from "prop-types";
import React, { Component } from "react";

import { arraysEqual } from "../utility/generic";

export default class Sidebar extends Component {
    static propTypes = {
        groups: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
        width: PropTypes.number.isRequired,
        canvasTop: PropTypes.number.isRequired,
        canvasBottom: PropTypes.number.isRequired,
        groupHeights: PropTypes.array.isRequired,
        groupRenderer: PropTypes.func,
        isRightSidebar: PropTypes.bool,
    };

    shouldComponentUpdate(nextProps) {
        return !(
            nextProps.width === this.props.width &&
            nextProps.canvasTop === this.props.canvasTop &&
            nextProps.canvasBottom === this.props.canvasBottom &&
            arraysEqual(nextProps.groups, this.props.groups) &&
            arraysEqual(nextProps.groupHeights, this.props.groupHeights)
        );
    }

    renderGroupContent(group, isRightSidebar, groupTitleKey, groupRightTitleKey) {
        if (this.props.groupRenderer) {
            return React.createElement(this.props.groupRenderer, {
                group,
                isRightSidebar,
            });
        } else {
            return group[isRightSidebar ? groupRightTitleKey : groupTitleKey];
        }
    }

    render() {
        const { width, groupHeights, isRightSidebar, canvasTop, canvasBottom } = this.props;

        const sidebarStyle = {
            top: `${canvasTop}px`,
            width: `${width}px`,
            height: `${canvasBottom - canvasTop}px`,
        };

        const groupsStyle = {
            width: `${width}px`,
        };

        let currentGroupTop = 0;
        let currentGroupBottom = 0;
        let totalSkippedGroupHeight = 0;

        let groupLines = this.props.groups.map((group, index) => {
            const groupHeight = groupHeights[index];

            // Go to the next group
            currentGroupTop = currentGroupBottom;
            currentGroupBottom += groupHeight;

            // Skip if the group is not on the canvas
            if (currentGroupBottom < canvasTop || currentGroupTop > canvasBottom) {
                totalSkippedGroupHeight += groupHeight;
                return undefined;
            }

            const elementStyle = {
                position: "relative",
                top: `${totalSkippedGroupHeight - canvasTop}px`,
                height: `${groupHeights[index]}px`,
                lineHeight: `${groupHeights[index]}px`,
            };

            return (
                <div
                    key={group.id}
                    className={"rct-sidebar-row rct-sidebar-row-" + (index % 2 === 0 ? "even" : "odd")}
                    style={elementStyle}
                >
                    {this.renderGroupContent(group, isRightSidebar, "title", "rightTitle")}
                </div>
            );
        });

        return (
            <div className={"rct-sidebar" + (isRightSidebar ? " rct-sidebar-right" : "")} style={sidebarStyle}>
                <div style={groupsStyle}>{groupLines}</div>
            </div>
        );
    }
}
