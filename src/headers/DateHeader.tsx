import React from "react";
import { TimelineStateConsumer } from "../timeline/TimelineStateContext";
import CustomHeader from "./CustomHeader";
import { getNextUnit } from "../utility/calendar";
import { defaultHeaderFormats } from "../default-config";
import memoize from "memoize-one";
import { CustomDateHeader } from "./CustomDateHeader";
import { Moment } from "moment";
import { TimeUnit } from "../types";

type Interval = {
    startTime: Moment;
    endTime: Moment;
    labelWidth: number; // TODO: do we need this?
    left: number; // TODO: do we need this?
};

type IntervalContext = {
    // TODO: I think the following original type was wrong, so I used `Interval` instead
    // interval: { startTime: number; endTime: number; labelWidth: number; left: number };
    interval: Interval;
    intervalText: string;
};

type GetIntervalProps = {
    interval?: Interval;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
};

type IntervalRenderer<Data> = {
    intervalContext: IntervalContext;
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number }; // TODO: I had to remove the Required
    data?: Data;
};

type SidebarHeaderChildrenFnProps<Data> = {
    getRootProps: (propsToOverride?: { style: React.CSSProperties }) => { style: React.CSSProperties };
    data: Data;
};

type DateHeaderProps<Data> = {
    style?: React.CSSProperties;
    className?: string;
    unit?: TimeUnit | "primaryHeader";
    labelFormat?: string | (([startTime, endTime]: [Moment, Moment], unit: TimeUnit, labelWidth: number) => string);
    intervalRenderer?: (props?: IntervalRenderer<Data>) => React.ReactNode;
    headerData?: Data; // TODO: I had to make this required
    children?: (props: SidebarHeaderChildrenFnProps<Data>) => React.ReactNode;
    height?: number;

    timelineUnit: TimeUnit; // TODO: this was a missing property
};

class DateHeader<Data> extends React.Component<DateHeaderProps<Data>> {
    getHeaderUnit = () => {
        if (this.props.unit === "primaryHeader") {
            return getNextUnit(this.props.timelineUnit);
        } else if (this.props.unit) {
            return this.props.unit;
        }
        return this.props.timelineUnit;
    };

    getRootStyle = memoize((style?: React.CSSProperties): React.CSSProperties => {
        return {
            height: 30,
            ...style,
        };
    });

    getLabelFormat = (interval: [Moment, Moment], unit: TimeUnit, labelWidth: number): string => {
        const { labelFormat } = this.props;
        if (typeof labelFormat === "string") {
            const startTime = interval[0];
            return startTime.format(labelFormat);
        } else if (typeof labelFormat === "function") {
            return labelFormat(interval, unit, labelWidth);
        } else {
            throw new Error("labelFormat should be function or string");
        }
    };

    getHeaderData = memoize(
        (
            intervalRenderer: ((props?: IntervalRenderer<Data>) => React.ReactNode) | undefined,
            style: React.CSSProperties,
            className: string | undefined,
            getLabelFormat: (interval: [Moment, Moment], unit: TimeUnit, labelWidth: number) => string,
            unitProp: TimeUnit | "primaryHeader" | undefined,
            headerData: Data | undefined,
        ) => {
            return {
                intervalRenderer,
                style,
                className,
                getLabelFormat,
                unitProp,
                headerData,
            };
        },
    );

    render() {
        const unit = this.getHeaderUnit();
        const { /* headerData, */ height } = this.props;
        return (
            <CustomHeader
                unit={unit}
                height={height}
                headerData={this.getHeaderData(
                    this.props.intervalRenderer,
                    this.getRootStyle(this.props.style),
                    this.props.className,
                    this.getLabelFormat,
                    this.props.unit,
                    this.props.headerData,
                )}
                // eslint-disable-next-line react/no-children-prop
                children={CustomDateHeader} // TODO: This is a bad practice, please refactor it
            />
        );
    }
}

type DateHeaderWrapperProps<Data> = {
    style?: React.CSSProperties;
    className?: string;
    unit?: TimeUnit | "primaryHeader";
    labelFormat?: string | (([startTime, endTime]: [Moment, Moment], unit: TimeUnit, labelWidth: number) => string);
    intervalRenderer?: (props?: IntervalRenderer<Data>) => React.ReactNode;
    headerData?: Data;
    height?: number;
};

function DateHeaderWrapper<Data>({
    unit,
    labelFormat = formatLabel,
    style,
    className,
    intervalRenderer,
    headerData,
    height,
}: DateHeaderWrapperProps<Data>) {
    return (
        <TimelineStateConsumer>
            {({ getTimelineState }) => {
                const timelineState = getTimelineState();
                return (
                    <DateHeader
                        timelineUnit={timelineState.timelineUnit}
                        unit={unit}
                        labelFormat={labelFormat}
                        style={style}
                        className={className}
                        intervalRenderer={intervalRenderer}
                        headerData={headerData}
                        height={height}
                    />
                );
            }}
        </TimelineStateConsumer>
    );
}

DateHeaderWrapper.defaultProps = {
    labelFormat: formatLabel,
};

function formatLabel(
    [timeStart, _timeEnd]: [Moment, Moment],
    unit: TimeUnit,
    labelWidth: number,
    formatOptions = defaultHeaderFormats,
) {
    let format;
    if (unit === "second") {
        // TODO: Please check this and the default values!
        throw new Error(`The "second" unit is not available in the default header formats`);
    }
    if (labelWidth >= 150) {
        format = formatOptions[unit]["long"];
    } else if (labelWidth >= 100) {
        format = formatOptions[unit]["mediumLong"];
    } else if (labelWidth >= 50) {
        format = formatOptions[unit]["medium"];
    } else {
        format = formatOptions[unit]["short"];
    }
    return timeStart.format(format);
}

export default DateHeaderWrapper;
