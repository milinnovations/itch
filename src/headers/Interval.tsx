import React from "react";
import { getNextUnit } from "../utility/calendar";
import { composeEvents } from "../utility/events";
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

type IntervalProps<Data> = {
    intervalRenderer?: (props?: IntervalRenderer<Data>) => React.ReactNode;
    unit: TimeUnit;
    interval: Interval;
    showPeriod: (startDate: Moment | number, endDate: Moment | number) => void;
    intervalText: string;
    primaryHeader: boolean;
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number }; // TODO: I had to remove the Required
    headerData?: Data;
};

class IntervalComponent<Data> extends React.PureComponent<IntervalProps<Data>> {
    onIntervalClick = () => {
        const { primaryHeader, interval, unit, showPeriod } = this.props;
        if (primaryHeader) {
            const nextUnit = getNextUnit(unit);
            const newStartTime = interval.startTime.clone().startOf(nextUnit);
            const newEndTime = interval.startTime.clone().endOf(nextUnit);
            showPeriod(newStartTime, newEndTime);
        } else {
            showPeriod(interval.startTime, interval.endTime);
        }
    };

    getIntervalProps = (props: GetIntervalProps = {}) => {
        return {
            ...this.props.getIntervalProps({
                interval: this.props.interval,
                ...props,
            }),
            onClick: composeEvents(this.onIntervalClick, props.onClick),
        };
    };

    render() {
        const { intervalText, interval, intervalRenderer, headerData } = this.props;
        if (intervalRenderer) {
            return intervalRenderer({
                getIntervalProps: this.getIntervalProps,
                intervalContext: {
                    interval,
                    intervalText,
                },
                data: headerData,
            });
        }

        return (
            <div
                data-testid="dateHeaderInterval"
                {...this.getIntervalProps({})}
                className={`rct-dateHeader ${this.props.primaryHeader ? "rct-dateHeader-primary" : ""}`}
            >
                <span>{intervalText}</span>
            </div>
        );
    }
}

export default IntervalComponent;
