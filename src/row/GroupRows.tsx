import React, { Component } from "react";

import { mapRange } from "../utility/generators";
import type { TimelineGroupBase } from "../types";

import { GroupRow } from "./GroupRow";

type Props<TGroup extends TimelineGroupBase = TimelineGroupBase> = {
    canvasWidth: number;
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
            nextProps.lineCount === this.props.lineCount &&
            nextProps.groupHeights === this.props.groupHeights &&
            nextProps.groups === this.props.groups
        );
    }

    render() {
        const {
            canvasWidth,
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

        return (
            <div className="rct-horizontal-lines">
                {Array.from(
                    mapRange(lineCount, index => (
                        <GroupRow
                            clickTolerance={clickTolerance}
                            onContextMenu={evt => onRowContextClick(evt, index)}
                            onClick={evt => onRowClick(evt, index)}
                            onDoubleClick={evt => onRowDoubleClick(evt, index)}
                            onDrop={onRowDrop !== undefined ? evt => onRowDrop(evt, index) : undefined}
                            key={`horizontal-line-${index}`}
                            isEvenRow={index % 2 === 0}
                            group={groups[index]}
                            horizontalLineClassNamesForGroup={horizontalLineClassNamesForGroup}
                            style={{
                                width: `${canvasWidth}px`,
                                height: `${groupHeights[index]}px`,
                            }}
                        />
                    )),
                )}
            </div>
        );
    }
}
