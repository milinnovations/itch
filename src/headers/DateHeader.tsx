import React from "react";
import memoize from "memoize-one";
import { Moment } from "moment";

import { defaultHeaderFormats } from "../default-config";
import { TimelineStateConsumer } from "../timeline/TimelineStateContext";
import { getNextUnit } from "../utility/calendar";

import type { TimeUnit, IntervalRenderer, DateHeaderProps } from "../types";

import { CustomDateHeader } from "./CustomDateHeader";
import CustomHeader from "./CustomHeader";

type WrappedDateHeaderProps<Data> = DateHeaderProps<Data> & {
    timelineUnit: TimeUnit;
};

class DateHeader<Data> extends React.Component<WrappedDateHeaderProps<Data>> {
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
        const { height } = this.props;
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

function DateHeaderWrapper<Data>({
    unit,
    labelFormat = formatLabel,
    style,
    className,
    intervalRenderer,
    headerData,
    height,
}: DateHeaderProps<Data>) {
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
