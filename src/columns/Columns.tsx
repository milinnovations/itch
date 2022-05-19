import React, { Component } from "react";

import type { CompleteTimeSteps, TimeUnit } from "../types";
import { generateTimes } from "../utility/calendar";
import { map } from "../utility/generators";
import { TimelineStateConsumer } from "../timeline/TimelineStateContext";

type BaseProps = {
    canvasTimeStart: number;
    canvasTimeEnd: number;
    canvasWidth: number;
    lineCount: number;
    height: number;
    minUnit: TimeUnit;
    timeSteps: CompleteTimeSteps;
    verticalLineClassNamesForTime: ((start: number, end: number) => string[]) | undefined;
};

type Props = BaseProps & {
    getLeftOffsetFromDate: (time: number) => number;
};

class Columns extends Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
        return !(
            nextProps.canvasTimeStart === this.props.canvasTimeStart &&
            nextProps.canvasTimeEnd === this.props.canvasTimeEnd &&
            nextProps.canvasWidth === this.props.canvasWidth &&
            nextProps.lineCount === this.props.lineCount &&
            nextProps.minUnit === this.props.minUnit &&
            nextProps.timeSteps === this.props.timeSteps &&
            nextProps.height === this.props.height &&
            nextProps.verticalLineClassNamesForTime === this.props.verticalLineClassNamesForTime
        );
    }

    render() {
        const {
            canvasTimeStart,
            canvasTimeEnd,
            canvasWidth,
            minUnit,
            timeSteps,
            height,
            verticalLineClassNamesForTime,
            getLeftOffsetFromDate,
        } = this.props;
        const lines: React.ReactNode[] = Array.from(
            map(generateTimes(canvasTimeStart, canvasTimeEnd, minUnit, timeSteps), ([time, nextTime]) => {
                const minUnitValue = time.get(minUnit === "day" ? "date" : minUnit);
                const firstOfType = minUnitValue === (minUnit === "day" ? 1 : 0);

                const classNames: string[] = [
                    "rct-vl",
                    firstOfType ? " rct-vl-first" : "",
                    minUnit === "day" || minUnit === "hour" || minUnit === "minute" ? ` rct-day-${time.day()} ` : "",
                    ...(verticalLineClassNamesForTime
                        ? verticalLineClassNamesForTime(
                              time.unix() * 1000, // turn into ms, which is what verticalLineClassNamesForTime expects
                              nextTime.unix() * 1000 - 1,
                          ) ?? []
                        : []),
                ];

                const left = getLeftOffsetFromDate(time.valueOf());
                const right = getLeftOffsetFromDate(nextTime.valueOf());
                return (
                    <div
                        key={`line-${time.valueOf()}`}
                        className={classNames.join(" ")}
                        style={{
                            pointerEvents: "none",
                            top: "0px",
                            left: `${left}px`,
                            width: `${right - left}px`,
                            height: `${height}px`,
                        }}
                    />
                );
            }),
        );

        return <div className="rct-vertical-lines">{lines}</div>;
    }
}

const ColumnsWrapper = (props: BaseProps) => {
    return (
        <TimelineStateConsumer>
            {({ getLeftOffsetFromDate }) => <Columns getLeftOffsetFromDate={getLeftOffsetFromDate} {...props} />}
        </TimelineStateConsumer>
    );
};

export default ColumnsWrapper;
