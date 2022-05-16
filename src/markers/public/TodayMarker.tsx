import React from "react";
import { TimelineMarkersConsumer } from "../TimelineMarkersContext";
import { TimelineMarkerType } from "../markerType";
import { Marker, MarkerWithoutId } from "markers/Marker";
import { TodayMarkerProps } from "../../types";

type WrappedTodayMarkerProps = TodayMarkerProps & {
    subscribeMarker: (marker: MarkerWithoutId) => {
        unsubscribe: () => void;
        getMarker: () => Marker;
    };
    updateMarker: (marker: Marker) => unknown;
};

const defaultInterval = 1000 * 10;

class TodayMarker extends React.Component<WrappedTodayMarkerProps> {
    private _unsubscribe: null | (() => void) = null;
    private _getMarker: null | (() => Marker) = null;

    componentDidMount() {
        const { unsubscribe, getMarker } = this.props.subscribeMarker({
            type: TimelineMarkerType.Today,
            renderer: this.props.children,
            interval: this.props.interval ?? defaultInterval,
        });
        this._unsubscribe = unsubscribe;
        this._getMarker = getMarker;
    }

    componentWillUnmount() {
        if (this._unsubscribe !== null) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
    }

    componentDidUpdate(prevProps: Readonly<WrappedTodayMarkerProps>) {
        if (prevProps.interval !== this.props.interval && this._getMarker) {
            const marker = this._getMarker();
            this.props.updateMarker({
                ...marker,
                interval: this.props.interval ?? defaultInterval,
            });
        }
    }

    render() {
        return null;
    }
}

// TODO: turn into HOC?
const TodayMarkerWrapper = (props: TodayMarkerProps) => {
    return (
        <TimelineMarkersConsumer>
            {({ subscribeMarker, updateMarker }) => (
                <TodayMarker subscribeMarker={subscribeMarker} updateMarker={updateMarker} {...props} />
            )}
        </TimelineMarkersConsumer>
    );
};

TodayMarkerWrapper.displayName = "TodayMarkerWrapper";

export default TodayMarkerWrapper;
