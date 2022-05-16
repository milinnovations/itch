import React, { Component } from "react";

import { mapRange } from "../utility/generators";
import type { TimelineGroupBase } from "../types";

import { GroupRow } from "./GroupRow";

type Props<TGroup extends TimelineGroupBase = TimelineGroupBase> = {
    canvasWidth: number;
    canvasTop: number;
    canvasBottom: number;
    clickTolerance: number;
    groups: TGroup[];
    groupHeights: number[];
    lineCount: number;
    onRowClick: (event: React.MouseEvent<Element, MouseEvent>, rowIndex: number) => void;
    onRowContextClick: (event: React.MouseEvent<Element, MouseEvent>, rowIndex: number) => void;
    onRowDoubleClick: (event: React.MouseEvent<Element, MouseEvent>, rowIndex: number) => void;
    horizontalLineClassNamesForGroup?: (group: TGroup) => string[] | undefined;
    onRowDrop?: (event: React.DragEvent, rowIndex: number) => void;
};

export class GroupRows<TGroup extends TimelineGroupBase = TimelineGroupBase> extends Component<Props<TGroup>> {
    shouldComponentUpdate(nextProps: Props<TGroup>) {
        return !(
            nextProps.canvasWidth === this.props.canvasWidth &&
            nextProps.canvasTop === this.props.canvasTop &&
            nextProps.canvasBottom === this.props.canvasBottom &&
            nextProps.lineCount === this.props.lineCount &&
            nextProps.groupHeights === this.props.groupHeights &&
            nextProps.groups === this.props.groups
        );
    }

    render() {
        const {
            canvasWidth,
            canvasTop,
            canvasBottom,
            lineCount,
            groupHeights,
            onRowDrop,
            onRowClick,
            onRowDoubleClick,
            clickTolerance,
            groups,
            horizontalLineClassNamesForGroup,
            onRowContextClick,
        } = this.props;

        let currentGroupTop = 0;
        let currentGroupBottom = 0;
        let totalSkippedGroupHeight = 0;

        return (
            <div className="rct-horizontal-lines">
                {Array.from(
                    mapRange(lineCount, index => {
                        const group = groups[index];
                        const groupHeight = groupHeights[index];

                        // Go to the next group
                        currentGroupTop = currentGroupBottom;
                        currentGroupBottom += groupHeight;

                        // Skip if the group is not on the canvas
                        if (currentGroupBottom < canvasTop || currentGroupTop > canvasBottom) {
                            totalSkippedGroupHeight += groupHeight;
                            return undefined;
                        }

                        return (
                            <GroupRow
                                clickTolerance={clickTolerance}
                                onContextMenu={evt => onRowContextClick(evt, index)}
                                onClick={evt => onRowClick(evt, index)}
                                onDoubleClick={evt => onRowDoubleClick(evt, index)}
                                onDrop={onRowDrop !== undefined ? evt => onRowDrop(evt, index) : undefined}
                                key={`horizontal-line-${index}`}
                                isEvenRow={index % 2 === 0}
                                group={group}
                                horizontalLineClassNamesForGroup={horizontalLineClassNamesForGroup}
                                style={{
                                    position: "relative",
                                    top: `${totalSkippedGroupHeight - canvasTop}px`,
                                    width: `${canvasWidth}px`,
                                    height: `${groupHeights[index]}px`,
                                }}
                            />
                        );
                    }),
                )}
            </div>
        );
    }
}
