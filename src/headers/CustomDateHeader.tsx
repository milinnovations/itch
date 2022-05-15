import React from "react";
import IntervalComponent from "./Interval";
import { Moment } from "moment";
import { TimeUnit } from "../types";

type Interval = {
    startTime: Moment;
    endTime: Moment;
    labelWidth: number; // TODO: do we need this?
    left: number; // TODO: do we need this?
};

type GetIntervalProps = {
    interval?: Interval;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
};

type HeaderContext = {
    // intervals: { startTime: Moment; endTime: Moment }[];
    intervals: Interval[];
    unit: TimeUnit;
};

type IntervalContext = {
    // TODO: I think the following original type was wrong, so I used `Interval` instead
    // interval: { startTime: number; endTime: number; labelWidth: number; left: number };
    interval: Interval;
    intervalText: string;
};

type IntervalRenderer<Data> = {
    intervalContext: IntervalContext;
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number }; // TODO: I had to remove the required
    data?: Data;
};

type HeaderData<Data> = {
    style: React.CSSProperties;
    intervalRenderer?: ((props?: IntervalRenderer<Data> | undefined) => React.ReactNode) | undefined;
    className?: string | undefined;
    getLabelFormat: (interval: [Moment, Moment], unit: TimeUnit, labelWidth: number) => string;
    unitProp?: TimeUnit | "primaryHeader"; // TODO: I had to make this optional
    headerData?: Data;
};

type CustomDateHeaderProps<Data> = {
    headerContext: HeaderContext;
    getRootProps: (propsToOverride?: { style: React.CSSProperties }) => { style: React.CSSProperties };
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number }; // TODO: I had to remove the Required
    showPeriod: (startDate: Moment | number, endDate: Moment | number) => void;
    data: HeaderData<Data>;
};

export function CustomDateHeader<Data>({
    headerContext: { intervals, unit },
    getRootProps,
    getIntervalProps,
    showPeriod,
    data: { style, intervalRenderer, className, getLabelFormat, unitProp, headerData },
}: CustomDateHeaderProps<Data>) {
    return (
        <div data-testid={`dateHeader`} className={className} {...getRootProps({ style })}>
            {intervals.map(interval => {
                const intervalText = getLabelFormat([interval.startTime, interval.endTime], unit, interval.labelWidth);
                return (
                    <IntervalComponent
                        key={`label-${interval.startTime.valueOf()}`}
                        unit={unit}
                        interval={interval}
                        showPeriod={showPeriod}
                        intervalText={intervalText}
                        primaryHeader={unitProp === "primaryHeader"}
                        getIntervalProps={getIntervalProps}
                        intervalRenderer={intervalRenderer}
                        headerData={headerData}
                    />
                );
            })}
        </div>
    );
}
