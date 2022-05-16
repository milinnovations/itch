import { TimelineMarkerType } from "./markerType";

// TODO: we should have better types based on usage in the `TimelineMarkersRenderer.tsx`

type CustomMarkerChildrenProps = {
    styles: React.CSSProperties;
    date: number;
};

type TodayMarker = {
    type: TimelineMarkerType.Today;
    renderer?: (props: CustomMarkerChildrenProps) => React.ReactNode;
    interval: number;

    date?: number; // Just to skip some casts
};

type CursorMarker = {
    type: TimelineMarkerType.Cursor;
    renderer?: (props: CustomMarkerChildrenProps) => React.ReactNode;

    interval?: number;
    date?: number;
};

type CustomMarker = {
    type: TimelineMarkerType.Custom;
    renderer?: (props: CustomMarkerChildrenProps) => React.ReactNode;
    interval?: number;
    date: number;
};

export type MarkerWithoutId = TodayMarker | CursorMarker | CustomMarker;

export type Marker = MarkerWithoutId & { id: number };
