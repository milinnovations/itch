import type React from "react";

export type Id = number | string;

export type TimelineItemEdge = "left" | "right";

export type ResizeOptions = boolean | TimelineItemEdge | "both";

export type CompleteTimeSteps = {
    second: number;
    minute: number;
    hour: number;
    day: number;
    month: number;
    year: number;
};

export type ITimeSteps = Partial<CompleteTimeSteps>;

export type TimeUnit = keyof CompleteTimeSteps;

export interface TimelineContext {
    timelineWidth: number;
    visibleTimeStart: number;
    visibleTimeEnd: number;
    canvasTimeStart: number;
    canvasTimeEnd: number;
}

export type TimelineGroupBase = {
    id: Id;
    title: React.ReactNode;
    rightTitle?: React.ReactNode;
    height?: number;
    stackItems?: boolean;
};

export type TimelineHeaderProps = {
    style?: React.CSSProperties;
    className?: string;
    calendarHeaderStyle?: React.CSSProperties;
    calendarHeaderClassName?: string;
    headerRef?: React.Ref<any>;
};

export type TimelineItemBase = {
    id: Id;
    group: Id;
    title?: React.ReactNode;
    start_time: number;
    end_time: number;
    canMove?: boolean;
    canResize?: ResizeOptions;
    canChangeGroup?: boolean;
    className?: string;
    style?: React.CSSProperties;
    itemProps?: React.HTMLAttributes<HTMLDivElement>;
};

export type TimelineItemProps = {};

export type TimelineKeys = {
    groupIdKey: string;
    groupTitleKey: string;
    groupRightTitleKey: string;
    itemIdKey: string;
    itemTitleKey: string;
    itemDivTitleKey: string;
    itemGroupKey: string;
    itemTimeStartKey: string;
    itemTimeEndKey: string;
};

export type ItemContext = {
    dimensions: {
        collisionLeft: number;
        collisionWidth: number;
        height: number;
        isDragging: boolean;
        left: number;
        order: {
            group: {
                id: string;
            };
            index: number;
        };
        originalLeft: number;
        stack: boolean;
        top: number | null;
        width: number;
    };
    useResizeHandle: boolean;
    title: string;
    canMove: boolean;
    canResizeLeft: boolean;
    canResizeRight: boolean;
    selected: boolean;
    dragging: boolean;
    dragStart: {
        x: number;
        y: number;
    };
    dragTime: number;
    dragGroupDelta: number;
    resizing: boolean;
    resizeEdge: TimelineItemEdge;
    resizeStart: number;
    resizeTime: number;
    width: boolean;
};

export type TimeFormat = {
    long: string;
    mediumLong: string;
    medium: string;
    short: string;
};

export type LabelFormat = {
    year: TimeFormat;
    month: TimeFormat;
    week: TimeFormat;
    day: TimeFormat;
    hour: TimeFormat;
    minute: TimeFormat;
};

export type ItemProps = {
    key: Id;
    ref: React.Ref<any>;
    className: string;
    onMouseDown: React.MouseEventHandler;
    onMouseUp: React.MouseEventHandler;
    onTouchStart: React.TouchEventHandler;
    onTouchEnd: React.TouchEventHandler;
    onDoubleClick: React.MouseEventHandler;
    onContextMenu: React.ReactEventHandler;
    style: React.CSSProperties;
};

type ItemRendererSideResizeProps = {
    ref: React.Ref<any>;
    className: string;
    style: React.CSSProperties;
};

export interface ItemRendererResizeProps {
    left?: ItemRendererSideResizeProps;
    right?: ItemRendererSideResizeProps;
}

export type ResizeStyles = {
    leftStyle?: React.CSSProperties;
    rightStyle?: React.CSSProperties;
    leftClassName?: string;
    rightClassName?: string;
};
