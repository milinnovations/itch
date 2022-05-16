// Type definitions for react-calendar-timeline v0.26.6
// Project: https://github.com/namespace-ee/react-calendar-timeline
// Definitions by: Rajab Shakirov <https://github.com/radziksh>
//                 Alex Maclean <https://github.com/acemac>
//                 Andrii Los <https://github.com/rip21>
//                 Jon Caruana <https://github.com/joncar>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.5

import type React from "react";
import type { Moment } from "moment";

import type {
    CompleteTimeSteps,
    Id as Id_,
    ItemContext as ItemContext_,
    ItemRendererResizeProps as ItemRendererResizeProps_,
    ITimeSteps as ITimeSteps_,
    LabelFormat as LabelFormat_,
    MoveResizeValidator,
    ReactCalendarItemRendererProps as ReactCalendarItemRendererProps_,
    ResizeOptions as ResizeOptions_,
    ResizeStyles as ResizeStyles_,
    TimelineContext as TimelineContext_,
    TimelineGroupBase as TimelineGroupBase_,
    TimelineHeaderProps as TimelineHeaderProps_,
    TimelineItemBase as TimelineItemBase_,
    TimelineItemEdge as TimelineItemEdge_,
    TimelineItemProps as TimelineItemProps_,
    TimeFormat as TimeFormat_,
    TimeUnit as TimeUnit_,
    Interval as Interval_,
    GetIntervalProps as GetIntervalProps_,
    HeaderContext as HeaderContext_,
    IntervalContext as IntervalContext_,
    IntervalRenderer as IntervalRenderer_,
    CustomHeaderPropsChildrenFnProps as CustomHeaderPropsChildrenFnProps_,
    SidebarHeaderChildrenFnProps as SidebarHeaderChildrenFnProps_,
    CustomHeaderProps as CustomHeaderProps_,
    DateHeaderProps as DateHeaderProps_,
    CustomMarkerChildrenProps as CustomMarkerChildrenProps_,
    MarkerProps as MarkerProps_,
    TodayMarkerProps as TodayMarkerProps_,
    CursorMarkerProps as CursorMarkerProps_,
} from "./types";

declare module "@mil/itch" {
    export type Id = Id_;
    export type ItemContext = ItemContext_;
    export type ItemRendererResizeProps = ItemRendererResizeProps_;
    export type ITimeSteps = ITimeSteps_;
    export type LabelFormat = LabelFormat_;
    export type ResizeOptions = ResizeOptions_;
    export type ResizeStyles = ResizeStyles_;
    export type TimelineContext = TimelineContext_;
    export type TimelineGroupBase = TimelineGroupBase_;
    export type TimelineHeaderProps = TimelineHeaderProps_;
    export type TimelineItemBase = TimelineItemBase_;
    export type TimelineItemEdge = TimelineItemEdge_;
    export type TimelineItemProps = TimelineItemProps_;
    export type TimeFormat = TimeFormat_;
    export type TimeUnit = TimeUnit_;

    export type TimelineItem<CustomItemFields> = TimelineItemBase & CustomItemFields;
    export type TimelineGroup<CustomGroupFields> = TimelineGroupBase & CustomGroupFields;

    export type ReactCalendarItemRendererProps<CustomItem extends TimelineItemBase = TimelineItemBase> =
        ReactCalendarItemRendererProps_<CustomItem>;

    export type ReactCalendarGroupRendererProps<CustomGroup extends TimelineGroupBase = TimelineGroupBase> = {
        group: CustomGroup;
        isRightSidebar?: boolean;
    };

    export type OnItemDragObjectBase = {
        eventType: "move" | "resize";
        itemId: Id;
        time: number;
    };

    export type OnItemDragObjectMove = OnItemDragObjectBase & {
        eventType: "move";
        newGroupOrder: number;
    };

    export type OnItemDragObjectResize = OnItemDragObjectBase & {
        eventType: "resize";
        edge?: TimelineItemEdge;
    };

    export type ReactCalendarTimelineProps<
        CustomItem extends TimelineItemBase = TimelineItemBase,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    > = {
        groups: CustomGroup[];
        items: CustomItem[];
        className?: string;
        defaultTimeStart?: Date | Moment;
        defaultTimeEnd?: Date | Moment;
        visibleTimeStart?: Date | Moment | number;
        visibleTimeEnd?: Date | Moment | number;
        selected?: number[];
        sidebarWidth?: number;
        sidebarContent?: React.ReactNode;
        rightSidebarWidth?: number;
        rightSidebarContent?: React.ReactNode;
        dragSnap?: number;
        minResizeWidth?: number;
        lineHeight?: number;
        itemHeightRatio?: number;
        minZoom?: number;
        maxZoom?: number;
        clickTolerance?: number;
        canMove?: boolean;
        canChangeGroup?: boolean;
        canResize?: ResizeOptions;
        useResizeHandle?: boolean;
        stackItems?: boolean;
        itemTouchSendsClick?: boolean;
        timeSteps?: ITimeSteps;
        scrollRef?: React.Ref<any>;
        zoomSpeed?: { alt: number; ctrl: number; meta: number };
        onItemDrag?(itemDragObject: OnItemDragObjectMove | OnItemDragObjectResize): void;
        onItemMove?(itemId: Id, dragTime: number, newGroupOrder: number): void;
        onItemResize?(itemId: Id, endTimeOrStartTime: number, edge: TimelineItemEdge): void;
        onItemSelect?(itemId: Id, e: any, time: number): void;
        onItemDeselect?(e: React.SyntheticEvent): void;
        onItemClick?(itemId: Id, e: React.SyntheticEvent, time: number): void;
        onItemDoubleClick?(itemId: Id, e: React.SyntheticEvent, time: number): void;
        onItemContextMenu?(itemId: Id, e: React.SyntheticEvent, time: number): void;
        onCanvasClick?(groupId: Id, time: number, e: React.SyntheticEvent): void;
        onCanvasContextMenu?(groupId: Id, time: number, e: React.SyntheticEvent): void;
        onCanvasDoubleClick?(groupId: Id, time: number, e: React.SyntheticEvent): void;
        onCanvasDrop?(groupId: Id, time: number, e: React.DragEvent): void;
        onZoom?(timelineContext: TimelineContext): void;
        moveResizeValidator?: MoveResizeValidator;
        onTimeChange?(
            visibleTimeStart: number,
            visibleTimeEnd: number,
            updateScrollCanvas: (start: number, end: number) => void,
        ): any;
        onBoundsChange?(canvasTimeStart: number, canvasTimeEnd: number): any;
        itemRenderer?: (props: ReactCalendarItemRendererProps<CustomItem>) => React.ReactNode;
        groupRenderer?: (props: ReactCalendarGroupRendererProps<CustomGroup>) => React.ReactNode;
        resizeDetector?: (containerResizeDetector: any) => void;
        verticalLineClassNamesForTime?: (start: number, end: number) => string[] | undefined;
        horizontalLineClassNamesForGroup?: (group: CustomGroup) => string[];

        // Fields that are in propTypes but not documented
        headerRef?: React.Ref<any>;
    };

    export class TimelineMarkers extends React.Component {}
    export type CustomMarkerChildrenProps = CustomMarkerChildrenProps_;
    export type MarkerProps = MarkerProps_;
    export class CustomMarker extends React.Component<MarkerProps> {}
    export type TodayMarkerProps = TodayMarkerProps_;
    export class TodayMarker extends React.Component<TodayMarkerProps> {}
    export type CursorMarkerProps = CursorMarkerProps_;
    export class CursorMarker extends React.Component<CursorMarkerProps> {}

    export class TimelineHeaders extends React.Component<TimelineHeaderProps> {}

    export type SidebarHeaderChildrenFnProps<Data> = SidebarHeaderChildrenFnProps_<Data>;

    export type SidebarHeaderProps<Data> = {
        variant?: "left" | "right";
        headerData?: Data;
        children: (props: SidebarHeaderChildrenFnProps<Data>) => React.ReactNode;
    };
    export class SidebarHeader<Data = any> extends React.Component<SidebarHeaderProps<Data>> {}

    export type IntervalContext = IntervalContext_;
    export type GetIntervalProps = GetIntervalProps_;
    export type IntervalRenderer<Data> = IntervalRenderer_<Data>;
    export type DateHeaderProps<Data> = DateHeaderProps_<Data>;
    export class DateHeader<Data = any> extends React.Component<DateHeaderProps<Data>> {}
    export type Interval = Interval_;
    export type HeaderContext = HeaderContext_;
    export type CustomHeaderPropsChildrenFnProps<Data> = CustomHeaderPropsChildrenFnProps_<Data>;
    export type CustomHeaderProps<Data> = CustomHeaderProps_<Data>;
    export class CustomHeader<Data = any> extends React.Component<CustomHeaderProps<Data>> {}

    export const defaultTimeSteps: CompleteTimeSteps;
    export const defaultHeaderFormats: LabelFormat;

    export default class ReactCalendarTimeline<
        CustomItem extends TimelineItemBase = TimelineItemBase,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    > extends React.Component<ReactCalendarTimelineProps<CustomItem, CustomGroup>> {}
}
