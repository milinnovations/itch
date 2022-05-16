import React from "react";
import { TimelineMarkersConsumer } from "../TimelineMarkersContext";
import { TimelineMarkerType } from "../markerType";
import { Marker } from "markers/Marker";
import { CursorMarkerProps } from "../../types";

type WrappedCursorMarkerProps = CursorMarkerProps & {
    subscribeMarker: (marker: Marker) => {
        unsubscribe: () => void;
        getMarker: () => Marker;
    };
};

class CursorMarker extends React.Component<WrappedCursorMarkerProps> {
    private _unsubscribe: null | (() => void) = null;

    componentDidMount() {
        const { unsubscribe } = this.props.subscribeMarker({
            type: TimelineMarkerType.Cursor,
            renderer: this.props.children,
        });
        this._unsubscribe = unsubscribe;
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
const CursorMarkerWrapper = (props: CursorMarkerProps) => {
    return (
        <TimelineMarkersConsumer>
            {({ subscribeMarker }) => <CursorMarker subscribeMarker={subscribeMarker} {...props} />}
        </TimelineMarkersConsumer>
    );
};

CursorMarkerWrapper.displayName = "CursorMarkerWrapper";

export default CursorMarkerWrapper;
