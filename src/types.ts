import type { Moment } from "moment";
import type React from "react";

export type Id = number | string;

export type ClickType = "touch" | "click";

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

export type TimelineContext = {
    timelineWidth: number;
    visibleTimeStart: number;
    visibleTimeEnd: number;
    canvasTimeStart: number;
    canvasTimeEnd: number;
};

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
    canSelect?: boolean;
    className?: string;
    style?: React.CSSProperties;
    itemProps?: React.HTMLAttributes<HTMLDivElement>;
};

export type TimelineItemProps = {
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

type ItemRendererSideResizeProps = {
    ref: React.Ref<any>;
    className: string;
    style: React.CSSProperties;
};

export type ItemRendererResizeProps = {
    left?: ItemRendererSideResizeProps;
    right?: ItemRendererSideResizeProps;
};

export type ResizeStyles = {
    leftStyle?: React.CSSProperties;
    rightStyle?: React.CSSProperties;
    leftClassName?: string;
    rightClassName?: string;
};

export type MoveResizeValidator = (
    action: "move" | "resize",
    itemId: Id,
    time: number,
    resizeEdge: TimelineItemEdge,
) => number;

export type ReactCalendarItemRendererProps<TItem extends TimelineItemBase = TimelineItemBase> = {
    item: TItem;
    itemContext: ItemContext;
    getItemProps: (props?: Partial<Omit<TimelineItemProps, "key" | "ref">>) => TimelineItemProps;
    getResizeProps: (styles?: ResizeStyles) => ItemRendererResizeProps;
};

export type Interval = {
    startTime: Moment;
    endTime: Moment;
    labelWidth: number;
    left: number;
};

export type GetIntervalProps = {
    interval?: Interval;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
};

export type HeaderContext = {
    intervals: Interval[];
    unit: TimeUnit;
};

// Only used internally for the IntervalRenderer but exported by the library
export type IntervalContext = {
    interval: Interval;
    intervalText: string;
};

export type IntervalRenderer<Data> = {
    intervalContext: IntervalContext;
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number };
    data?: Data;
};

export type CustomHeaderPropsChildrenFnProps<Data> = {
    timelineContext: TimelineContext;
    headerContext: HeaderContext;
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number };
    getRootProps: (propsToOverride?: { style: React.CSSProperties }) => { style: React.CSSProperties };
    showPeriod: (startDate: Moment | number, endDate: Moment | number) => void;
    data: Data;
};

export type SidebarHeaderChildrenFnProps<Data> = {
    getRootProps: (propsToOverride?: { style: React.CSSProperties }) => { style: React.CSSProperties };
    data: Data;
};

export type CustomHeaderProps<Data> = {
    unit?: TimeUnit;
    headerData: Data;
    height?: number;
    children: (props: CustomHeaderPropsChildrenFnProps<Data>) => JSX.Element;
};

export type DateHeaderProps<Data> = {
    style?: React.CSSProperties;
    className?: string;
    unit?: TimeUnit | "primaryHeader";
    labelFormat?: string | (([startTime, endTime]: [Moment, Moment], unit: TimeUnit, labelWidth: number) => string);
    intervalRenderer?: (props?: IntervalRenderer<Data>) => React.ReactNode;
    headerData?: Data;
    height?: number;
    children?: (props: SidebarHeaderChildrenFnProps<Data>) => React.ReactNode; // TODO: is this used anywhere???
};
