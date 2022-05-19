// Type definitions for react-calendar-timeline v0.26.6
// Project: https://github.com/namespace-ee/react-calendar-timeline
// Definitions by: Rajab Shakirov <https://github.com/radziksh>
//                 Alex Maclean <https://github.com/acemac>
//                 Andrii Los <https://github.com/rip21>
//                 Jon Caruana <https://github.com/joncar>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.5

import type React from "react";

import type {
    CompleteTimeSteps,
    Id as Id_,
    ItemContext as ItemContext_,
    ItemRendererResizeProps as ItemRendererResizeProps_,
    ITimeSteps as ITimeSteps_,
    LabelFormat as LabelFormat_,
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
    ReactCalendarGroupRendererProps as ReactCalendarGroupRendererProps_,
    OnItemDragObjectBase as OnItemDragObjectBase_,
    OnItemDragObjectMove as OnItemDragObjectMove_,
    OnItemDragObjectResize as OnItemDragObjectResize_,
    ReactCalendarTimelineProps as ReactCalendarTimelineProps_,
} from "./types";

declare module "@mil/itch" {
    export type Id = Id_;
    export type ItemContext<TGroup extends TimelineGroupBase> = ItemContext_<TGroup>;
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

    export type ReactCalendarItemRendererProps<
        CustomItem extends TimelineItemBase,
        CustomGroup extends TimelineGroupBase,
    > = ReactCalendarItemRendererProps_<CustomItem, CustomGroup>;

    export type ReactCalendarGroupRendererProps<CustomGroup extends TimelineGroupBase> =
        ReactCalendarGroupRendererProps_<CustomGroup>;

    export type OnItemDragObjectBase = OnItemDragObjectBase_;

    export type OnItemDragObjectMove = OnItemDragObjectMove_;

    export type OnItemDragObjectResize = OnItemDragObjectResize_;

    export type ReactCalendarTimelineProps<
        CustomItem extends TimelineItemBase = TimelineItemBase,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    > = ReactCalendarTimelineProps_<CustomItem, CustomGroup>;

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
