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
    ResizeOptions as ResizeOptions_,
    ResizeStyles as ResizeStyles_,
    TimelineContext as TimelineContext_,
    TimelineGroupBase as TimelineGroupBase_,
    TimelineHeaderProps as TimelineHeaderProps_,
    TimelineItemBase as TimelineItemBase_,
    TimelineItemEdge as TimelineItemEdge_,
    TimelineItemProps as TimelineItemProps_,
    TimelineKeys as TimelineKeys_,
    TimeFormat as TimeFormat_,
    TimeUnit as TimeUnit_,
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
    export type TimelineKeys = TimelineKeys_;
    export type TimeFormat = TimeFormat_;
    export type TimeUnit = TimeUnit_;

    export type TimelineItem<CustomItemFields> = TimelineItemBase & CustomItemFields;
    export type TimelineGroup<CustomGroupFields> = TimelineGroupBase & CustomGroupFields;

    export interface ReactCalendarItemRendererProps<CustomItem extends TimelineItemBase = TimelineItemBase> {
        item: CustomItem;
        itemContext: ItemContext;
        getItemProps: (props?: Partial<Omit<TimelineItemProps, "key" | "ref">>) => TimelineItemProps;
        getResizeProps: (styles?: ResizeStyles) => ItemRendererResizeProps;
    }

    export interface ReactCalendarGroupRendererProps<CustomGroup extends TimelineGroupBase = TimelineGroupBase> {
        group: CustomGroup;
        isRightSidebar?: boolean;
    }

    export interface OnItemDragObjectBase {
        eventType: "move" | "resize";
        itemId: Id;
        time: number;
    }

    export interface OnItemDragObjectMove extends OnItemDragObjectBase {
        eventType: "move";
        newGroupOrder: number;
    }

    export interface OnItemDragObjectResize extends OnItemDragObjectBase {
        eventType: "resize";
        edge?: TimelineItemEdge;
    }

    export interface ReactCalendarTimelineProps<
        CustomItem extends TimelineItemBase = TimelineItemBase,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    > {
        groups: CustomGroup[];
        items: CustomItem[];
        keys?: TimelineKeys;
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
        moveResizeValidator?(action: "move" | "resize", itemId: Id, time: number, resizeEdge: TimelineItemEdge): number;
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
    }

    export class TimelineMarkers extends React.Component {}

    export interface CustomMarkerChildrenProps {
        styles: React.CSSProperties;
        date: number;
    }
    export interface MarkerProps {
        date: Date | number;
        children?: (props: CustomMarkerChildrenProps) => React.ReactNode;
    }

    export class CustomMarker extends React.Component<MarkerProps> {}

    export interface TodayMarkerProps extends MarkerProps {
        interval?: number;
    }
    export class TodayMarker extends React.Component<TodayMarkerProps> {}

    export type CursorMarkerProps = Omit<MarkerProps, "date">;
    export class CursorMarker extends React.Component<CursorMarkerProps> {}

    export class TimelineHeaders extends React.Component<TimelineHeaderProps> {}

    export interface SidebarHeaderChildrenFnProps<Data> {
        getRootProps: (propsToOverride?: { style: React.CSSProperties }) => { style: React.CSSProperties };
        data: Data;
    }

    export interface SidebarHeaderProps<Data> {
        variant?: "left" | "right";
        headerData?: Data;
        children: (props: SidebarHeaderChildrenFnProps<Data>) => React.ReactNode;
    }
    export class SidebarHeader<Data = any> extends React.Component<SidebarHeaderProps<Data>> {}

    export interface IntervalContext {
        interval: { startTime: number; endTime: number; labelWidth: number; left: number };
        intervalText: string;
    }
    export interface GetIntervalProps {
        interval?: Interval;
        style?: React.CSSProperties;
        onClick?: React.MouseEventHandler;
    }
    export interface IntervalRenderer<Data> {
        intervalContext: IntervalContext;
        getIntervalProps: (props?: GetIntervalProps) => Required<GetIntervalProps> & { key: string | number };
        data?: Data;
    }
    export interface DateHeaderProps<Data> {
        style?: React.CSSProperties;
        className?: string;
        unit?: TimeUnit | "primaryHeader";
        labelFormat?: string | (([startTime, endTime]: [Moment, Moment], unit: TimeUnit, labelWidth: number) => string);
        intervalRenderer?: (props?: IntervalRenderer<Data>) => React.ReactNode;
        headerData?: Data;
        children?: (props: SidebarHeaderChildrenFnProps<Data>) => React.ReactNode;
        height?: number;
    }
    export class DateHeader<Data = any> extends React.Component<DateHeaderProps<Data>> {}
    export interface Interval {
        startTime: Moment;
        endTime: Moment;
    }
    export interface HeaderContext {
        intervals: { startTime: Moment; endTime: Moment }[];
        unit: string;
    }
    export interface CustomHeaderPropsChildrenFnProps<Data> {
        timelineContext: TimelineContext;
        headerContext: HeaderContext;
        getIntervalProps: (props?: GetIntervalProps) => Required<GetIntervalProps> & { key: string | number };
        getRootProps: (propsToOverride?: { style: React.CSSProperties }) => { style: React.CSSProperties };
        showPeriod: (startDate: Moment | number, endDate: Moment | number) => void;
        data: Data;
    }
    export interface CustomHeaderProps<Data> {
        unit?: TimeUnit;
        headerData?: Data;
        height?: number;
        children: (props?: CustomHeaderPropsChildrenFnProps<Data>) => React.ReactNode;
    }
    export class CustomHeader<Data = any> extends React.Component<CustomHeaderProps<Data>> {}

    export const defaultKeys: TimelineKeys;
    export const defaultTimeSteps: CompleteTimeSteps;
    export const defaultHeaderFormats: LabelFormat;

    export default class ReactCalendarTimeline<
        CustomItem extends TimelineItemBase = TimelineItemBase,
        CustomGroup extends TimelineGroupBase = TimelineGroupBase,
    > extends React.Component<ReactCalendarTimelineProps<CustomItem, CustomGroup>> {}
}
