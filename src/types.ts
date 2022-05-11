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
