import React from "react";
import { getNextUnit } from "../utility/calendar";
import { composeEvents } from "../utility/events";
import { Moment } from "moment";
import { TimeUnit } from "../types";
import { GetIntervalProps, Interval, IntervalRenderer } from "../types";

type IntervalProps<Data> = {
    intervalRenderer?: (props?: IntervalRenderer<Data>) => React.ReactNode;
    unit: TimeUnit;
    interval: Interval;
    showPeriod: (startDate: Moment | number, endDate: Moment | number) => void;
    intervalText: string;
    primaryHeader: boolean;
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number };
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
