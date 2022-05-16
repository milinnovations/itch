import React from "react";
import IntervalComponent from "./Interval";
import { Moment } from "moment";
import { TimeUnit, GetIntervalProps, HeaderContext, IntervalRenderer } from "../types";

type HeaderData<Data> = {
    style: React.CSSProperties;
    intervalRenderer?: ((props?: IntervalRenderer<Data> | undefined) => React.ReactNode) | undefined;
    className?: string | undefined;
    getLabelFormat: (interval: [Moment, Moment], unit: TimeUnit, labelWidth: number) => string;
    unitProp?: TimeUnit | "primaryHeader";
    headerData?: Data;
};

type CustomDateHeaderProps<Data> = {
    headerContext: HeaderContext;
    getRootProps: (propsToOverride?: { style: React.CSSProperties }) => { style: React.CSSProperties };
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number };
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
