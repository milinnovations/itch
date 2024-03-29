import React, { useCallback, useMemo } from "react";

import { PreventClickOnDrag } from "../interaction/PreventClickOnDrag";
import type { TimelineGroupBase } from "../types";

type Props<TGroup extends TimelineGroupBase = TimelineGroupBase> = {
    clickTolerance: number;
    group: TGroup;
    isEvenRow: boolean;
    style: React.CSSProperties;
    onClick: (event: React.MouseEvent<Element, MouseEvent>) => void;
    onContextMenu: React.MouseEventHandler<HTMLDivElement>;
    onDoubleClick: React.MouseEventHandler<HTMLDivElement>;
    onDrop?: React.DragEventHandler<HTMLDivElement>;
    horizontalLineClassNamesForGroup?: (group: TGroup) => string[] | undefined;
};

export function GroupRow<TGroup extends TimelineGroupBase = TimelineGroupBase>(props: Props<TGroup>) {
    const {
        group,
        onClick,
        onContextMenu,
        onDoubleClick,
        onDrop,
        isEvenRow,
        style,
        clickTolerance,
        horizontalLineClassNamesForGroup,
    } = props;

    const className = useMemo((): string => {
        return [
            isEvenRow ? "rct-hl-even" : "rct-hl-odd",
            ...((horizontalLineClassNamesForGroup !== undefined
                ? horizontalLineClassNamesForGroup(group)
                : undefined) ?? []),
        ].join(" ");
    }, [horizontalLineClassNamesForGroup, group, isEvenRow]);
    const onDragOver = useCallback(
        (event: React.DragEvent) => {
            if (onDrop !== undefined) event.preventDefault();
        },
        [onDrop],
    );

    return (
        <PreventClickOnDrag
            clickTolerance={clickTolerance}
            onClick={onClick}
            renderChildren={childProps => (
                <div
                    {...childProps}
                    onContextMenu={onContextMenu}
                    onDoubleClick={onDoubleClick}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className={className}
                    style={style}
                />
            )}
        ></PreventClickOnDrag>
    );
}
