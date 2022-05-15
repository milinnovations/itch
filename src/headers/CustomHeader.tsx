import React from "react";
import { TimelineHeadersConsumer } from "./HeadersContext";
import { TimelineStateConsumer } from "../timeline/TimelineStateContext";
import { iterateTimes /*, calculateXPositionForTime */ } from "../utility/calendar";
import { Moment } from "moment";
import { TimelineContext, TimeUnit } from "../types";

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

type CustomHeaderPropsChildrenFnProps<Data> = {
    timelineContext: TimelineContext;
    headerContext: HeaderContext;
    getIntervalProps: (props?: GetIntervalProps) => GetIntervalProps & { key: string | number }; // TODO: This can't be `Required<GetIntervalProps>`
    getRootProps: (propsToOverride?: { style: React.CSSProperties }) => { style: React.CSSProperties };
    showPeriod: (startDate: Moment | number, endDate: Moment | number) => void;
    data: Data;
};

type WrappedCustomHeaderProps<Data> = {
    //component props
    children: (props: CustomHeaderPropsChildrenFnProps<Data>) => JSX.Element;
    unit: TimeUnit;
    //Timeline context
    timeSteps: object;
    visibleTimeStart: number;
    visibleTimeEnd: number;
    canvasTimeStart: number;
    canvasTimeEnd: number;
    canvasWidth: number;
    showPeriod: (startDate: Moment | number, endDate: Moment | number) => void;
    headerData: Data;
    getLeftOffsetFromDate: (date: number) => number;
    height: number;

    timelineUnit: TimeUnit; // TODO: This was originally missing
    timelineWidth: number; // TODO: This was originally missing
};

type WrappedCustomHeaderState = {
    intervals: Interval[];
};

export class CustomHeader<Data> extends React.Component<WrappedCustomHeaderProps<Data>, WrappedCustomHeaderState> {
    constructor(props: WrappedCustomHeaderProps<Data>) {
        super(props);
        const {
            canvasTimeStart,
            canvasTimeEnd,
            /* canvasWidth, */ unit,
            timeSteps,
            /* showPeriod, */ getLeftOffsetFromDate,
        } = props;

        const intervals = this.getHeaderIntervals({
            canvasTimeStart,
            canvasTimeEnd,
            // canvasWidth, // TODO: Please remove this if it is really not necessary
            unit,
            timeSteps,
            // showPeriod, // TODO: Please remove this if it is really not necessary
            getLeftOffsetFromDate,
        });

        this.state = {
            intervals,
        };
    }

    shouldComponentUpdate(nextProps: Readonly<WrappedCustomHeaderProps<Data>>) {
        if (
            nextProps.canvasTimeStart !== this.props.canvasTimeStart ||
            nextProps.canvasTimeEnd !== this.props.canvasTimeEnd ||
            nextProps.canvasWidth !== this.props.canvasWidth ||
            nextProps.unit !== this.props.unit ||
            nextProps.timeSteps !== this.props.timeSteps ||
            nextProps.showPeriod !== this.props.showPeriod ||
            nextProps.children !== this.props.children ||
            nextProps.headerData !== this.props.headerData
        ) {
            return true;
        }
        return false;
    }

    // TODO: deprecated react method
    // eslint-disable-next-line react/no-deprecated
    componentWillReceiveProps(nextProps: Readonly<WrappedCustomHeaderProps<Data>>) {
        if (
            nextProps.canvasTimeStart !== this.props.canvasTimeStart ||
            nextProps.canvasTimeEnd !== this.props.canvasTimeEnd ||
            nextProps.canvasWidth !== this.props.canvasWidth ||
            nextProps.unit !== this.props.unit ||
            nextProps.timeSteps !== this.props.timeSteps ||
            nextProps.showPeriod !== this.props.showPeriod
        ) {
            const {
                canvasTimeStart,
                canvasTimeEnd,
                /* canvasWidth, */ unit,
                timeSteps,
                /* showPeriod, */ getLeftOffsetFromDate,
            } = nextProps;

            const intervals = this.getHeaderIntervals({
                canvasTimeStart,
                canvasTimeEnd,
                // canvasWidth, // TODO: Please remove this if it is really not necessary
                unit,
                timeSteps,
                // showPeriod, // TODO: Please remove this if it is really not necessary
                getLeftOffsetFromDate,
            });

            this.setState({ intervals });
        }
    }

    getHeaderIntervals = ({
        canvasTimeStart,
        canvasTimeEnd,
        unit,
        timeSteps,
        getLeftOffsetFromDate,
    }: Pick<
        WrappedCustomHeaderProps<Data>,
        "canvasTimeStart" | "canvasTimeEnd" | "unit" | "timeSteps" | "getLeftOffsetFromDate"
    >) => {
        const intervals: Interval[] = [];
        iterateTimes(canvasTimeStart, canvasTimeEnd, unit, timeSteps, (startTime, endTime) => {
            const left = getLeftOffsetFromDate(startTime.valueOf());
            const right = getLeftOffsetFromDate(endTime.valueOf());
            const width = right - left;
            intervals.push({
                startTime,
                endTime,
                labelWidth: width,
                left,
            });
        });
        return intervals;
    };

    getRootProps = (props: { style?: React.CSSProperties } = {}) => {
        const { style } = props;
        return {
            style: Object.assign({}, style ? style : {}, {
                position: "relative",
                width: this.props.canvasWidth,
                height: this.props.height,
            }),
        };
    };

    getIntervalProps = (props: GetIntervalProps = {}): GetIntervalProps & { key: string | number } => {
        const { interval, style } = props;
        if (!interval) throw new Error("you should provide interval to the prop getter");
        const { startTime, labelWidth, left } = interval;
        return {
            style: this.getIntervalStyle({
                style,
                // startTime, // TODO: Remove if this is really not necessary
                labelWidth,
                // canvasTimeStart: this.props.canvasTimeStart, // TODO: Remove if this is really not necessary
                // unit: this.props.unit, // TODO: Remove if this is really not necessary
                left,
            }),
            key: `label-${startTime.valueOf()}`,
        };
    };

    getIntervalStyle = ({
        left,
        labelWidth,
        style,
    }: {
        left: number;
        labelWidth: number;
        style?: React.CSSProperties;
    }): React.CSSProperties => {
        return {
            ...style,
            left,
            width: labelWidth,
            position: "absolute",
        };
    };

    getStateAndHelpers = (): CustomHeaderPropsChildrenFnProps<Data> => {
        const {
            canvasTimeStart,
            canvasTimeEnd,
            unit,
            showPeriod,
            timelineWidth,
            visibleTimeStart,
            visibleTimeEnd,
            headerData,
        } = this.props;
        //TODO: only evaluate on changing params
        return {
            timelineContext: {
                timelineWidth,
                visibleTimeStart,
                visibleTimeEnd,
                canvasTimeStart,
                canvasTimeEnd,
            },
            headerContext: {
                unit,
                intervals: this.state.intervals,
            },
            getRootProps: this.getRootProps,
            getIntervalProps: this.getIntervalProps,
            showPeriod,
            data: headerData,
        };
    };

    render() {
        const props = this.getStateAndHelpers();
        const Renderer = this.props.children;
        return <Renderer {...props} />;
    }
}

type CustomHeaderProps<Data> = {
    unit?: TimeUnit;
    headerData: Data;
    height?: number;
    children: (props: CustomHeaderPropsChildrenFnProps<Data>) => JSX.Element;
};

function CustomHeaderWrapper<Data>({ children, unit, headerData, height = 30 }: CustomHeaderProps<Data>) {
    return (
        <TimelineStateConsumer>
            {({ getTimelineState, showPeriod, getLeftOffsetFromDate }) => {
                const timelineState = getTimelineState();
                return (
                    <TimelineHeadersConsumer>
                        {({ timeSteps }) => (
                            <CustomHeader
                                // TODO: the following linter warning marks a bad programming practice...
                                // eslint-disable-next-line react/no-children-prop
                                children={children}
                                timeSteps={timeSteps}
                                showPeriod={showPeriod}
                                unit={unit ? unit : timelineState.timelineUnit}
                                {...timelineState}
                                headerData={headerData}
                                getLeftOffsetFromDate={getLeftOffsetFromDate}
                                height={height}
                            />
                        )}
                    </TimelineHeadersConsumer>
                );
            }}
        </TimelineStateConsumer>
    );
}

export default CustomHeaderWrapper;
