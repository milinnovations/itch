import React from "react";
import { TimelineMarkersConsumer } from "../TimelineMarkersContext";
import { TimelineMarkerType } from "../markerType";
import { Marker, MarkerWithoutId } from "markers/Marker";
import { MarkerProps } from "types";

type WrappedTodayMarkerProps = MarkerProps & {
    subscribeMarker: (marker: MarkerWithoutId) => {
        unsubscribe: () => void;
        getMarker: () => Marker;
    };
    updateMarker: (marker: Marker) => unknown;
};

class CustomMarker extends React.Component<WrappedTodayMarkerProps> {
    private _unsubscribe: null | (() => void) = null;
    private _getMarker: null | (() => Marker) = null;

    componentDidUpdate(prevProps: Readonly<WrappedTodayMarkerProps>) {
        if (prevProps.date !== this.props.date && this._getMarker) {
            const marker = this._getMarker();
            this.props.updateMarker({ ...marker, date: this.props.date });
        }
    }

    componentDidMount() {
        const { unsubscribe, getMarker } = this.props.subscribeMarker({
            type: TimelineMarkerType.Custom,
            renderer: this.props.children,
            date: this.props.date,
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

    render() {
        return null;
    }
}

// TODO: turn into HOC?
const CustomMarkerWrapper = (props: MarkerProps) => {
    return (
        <TimelineMarkersConsumer>
            {({ subscribeMarker, updateMarker }) => (
                <CustomMarker subscribeMarker={subscribeMarker} updateMarker={updateMarker} {...props} />
            )}
        </TimelineMarkersConsumer>
    );
};

CustomMarkerWrapper.displayName = "CustomMarkerWrapper";

export default CustomMarkerWrapper;
