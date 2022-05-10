export interface ITimeSteps {
    second?: number;
    minute?: number;
    hour?: number;
    day?: number;
    month?: number;
    year?: number;
}

export type TimeUnit = keyof ITimeSteps;

export type Id = number | string;

export interface TimelineGroupBase {
    id: Id;
    title: React.ReactNode;
    rightTitle?: React.ReactNode;
    height?: number;
    stackItems?: boolean;
}

export interface TimelineKeys {
    groupIdKey: string;
    groupTitleKey: string;
    groupRightTitleKey: string;
    itemIdKey: string;
    itemTitleKey: string;
    itemDivTitleKey: string;
    itemGroupKey: string;
    itemTimeStartKey: string;
    itemTimeEndKey: string;
}

export interface TimelineItemBase {
    id: Id;
    group: Id;
    title?: React.ReactNode;
    start_time: number;
    end_time: number;
    canMove?: boolean;
    canResize?: boolean | "left" | "right" | "both";
    canChangeGroup?: boolean;
    className?: string;
    style?: React.CSSProperties;
    itemProps?: React.HTMLAttributes<HTMLDivElement>;
}
