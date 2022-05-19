import React, { Component } from "react";

import { getParentPosition } from "../utility/dom-helpers";

type ZoomSpeed = {
    alt: number;
    meta: number;
    ctrl: number;
};

const defaultZoomSpeed: ZoomSpeed = {
    alt: 1,
    meta: 2,
    ctrl: 2,
};

type TouchCoordinates = {
    x: number;
    y: number;
    scrollY: number;
};

type Props = {
    children: React.ReactChild;
    width: number;
    height: number;
    top: number;
    scrollRef: React.RefCallback<HTMLDivElement>;
    isInteractingWithItem: boolean;
    onZoom: (scale: number, offset: number) => void;
    onWheelZoom: (speed: number, xPosition: number, deltaY: number) => void;
    onHorizontalScroll: (scrollX: number) => void;
    onVerticalScrollBy: (deltaY: number) => void;
    zoomSpeed?: ZoomSpeed;
};

export default class ScrollElement extends Component<Props, { isDragging: boolean }> {
    private _scrollComponent: HTMLDivElement | null = null;
    private _lastTouchDistance: number | null = null;
    private _singleTouchStart: TouchCoordinates | null = null;
    private _lastSingleTouch: TouchCoordinates | null = null;

    constructor(props: Props) {
        super(props);

        this.state = {
            isDragging: false,
        };
    }

    componentWillUnmount() {
        if (this._scrollComponent) {
            this._scrollComponent.removeEventListener("wheel", this.handleWheel);
        }
    }

    handleScroll = () => {
        if (!this._scrollComponent) return;

        const scrollX = this._scrollComponent.scrollLeft;
        this.props.onHorizontalScroll(scrollX);
    };

    refHandler = (el: HTMLDivElement) => {
        this._scrollComponent = el;
        this.props.scrollRef(el);
        if (el) {
            el.addEventListener("wheel", this.handleWheel, { passive: false });
        }
    };

    handleWheel = (e: WheelEvent) => {
        // zoom in the time dimension
        if (e.ctrlKey || e.metaKey || e.altKey) {
            e.preventDefault();
            const parentPosition = getParentPosition(e.currentTarget as HTMLDivElement); // We use the handler on a DIV so it is safe to cast
            const xPosition = e.clientX - parentPosition.x;

            const speeds = this.props.zoomSpeed ?? defaultZoomSpeed;
            const speed = e.ctrlKey ? speeds.ctrl : e.metaKey ? speeds.meta : speeds.alt;

            // convert vertical zoom to horiziontal
            this.props.onWheelZoom(speed, xPosition, e.deltaY);
        } else if (e.shiftKey && this._scrollComponent) {
            e.preventDefault();
            // shift+scroll event from a touchpad has deltaY property populated; shift+scroll event from a mouse has deltaX
            this.props.onHorizontalScroll(this._scrollComponent.scrollLeft + (e.deltaY || e.deltaX));
            // no modifier pressed? we prevented the default event, so scroll or zoom as needed
        }
    };

    handleMouseDown = (e: React.MouseEvent) => {
        if (e.isDefaultPrevented()) return;

        if (e.button === 0) {
            this.setState({
                isDragging: true,
            });
            e.preventDefault();
        }
    };

    handleMouseMove = (e: React.MouseEvent) => {
        // this.props.onMouseMove(e)
        //why is interacting with item important?
        if (this.state.isDragging && !this.props.isInteractingWithItem && this._scrollComponent) {
            this.props.onHorizontalScroll(this._scrollComponent.scrollLeft - e.movementX);
            this.props.onVerticalScrollBy(-e.movementY);
        }
    };

    handleMouseUp = () => {
        this.setState({
            isDragging: false,
        });
    };

    handleMouseLeave = () => {
        // this.props.onMouseLeave(e)
        this.setState({
            isDragging: false,
        });
    };

    handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();

            this._lastTouchDistance = Math.abs(e.touches[0].screenX - e.touches[1].screenX);
            this._singleTouchStart = null;
            this._lastSingleTouch = null;
        } else if (e.touches.length === 1) {
            e.preventDefault();

            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;

            this._lastTouchDistance = null;
            this._singleTouchStart = { x: x, y: y, scrollY: window.scrollY };
            this._lastSingleTouch = { x: x, y: y, scrollY: window.scrollY };
        }
    };

    handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const { isInteractingWithItem, width, onZoom } = this.props;
        if (isInteractingWithItem) {
            e.preventDefault();
            return;
        }
        if (this._lastTouchDistance && e.touches.length === 2) {
            e.preventDefault();
            const touchDistance = Math.abs(e.touches[0].screenX - e.touches[1].screenX);
            const parentPosition = getParentPosition(e.currentTarget);
            const xPosition = (e.touches[0].screenX + e.touches[1].screenX) / 2 - parentPosition.x;
            if (touchDistance !== 0 && this._lastTouchDistance !== 0) {
                onZoom(this._lastTouchDistance / touchDistance, xPosition / width);
                this._lastTouchDistance = touchDistance;
            }
        } else if (this._lastSingleTouch && this._singleTouchStart && e.touches.length === 1) {
            e.preventDefault();
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            this._lastSingleTouch = { x: x, y: y, scrollY: window.scrollY };

            const deltaX = x - this._lastSingleTouch.x;
            const deltaX0 = x - this._singleTouchStart.x;
            const deltaY0 = y - this._singleTouchStart.y;

            const moveX = Math.abs(deltaX0) * 3 > Math.abs(deltaY0);
            const moveY = Math.abs(deltaY0) * 3 > Math.abs(deltaX0);
            if (deltaX !== 0 && moveX && this._scrollComponent) {
                this.props.onHorizontalScroll(this._scrollComponent.scrollLeft - deltaX);
            }
            if (moveY) {
                window.scrollTo(window.pageXOffset, this._singleTouchStart.scrollY - deltaY0);
            }
        }
    };

    handleTouchEnd = () => {
        if (this._lastTouchDistance) {
            this._lastTouchDistance = null;
        }
        if (this._lastSingleTouch) {
            this._lastSingleTouch = null;
            this._singleTouchStart = null;
        }
    };

    render() {
        const { width, height, top, children } = this.props;
        const { isDragging } = this.state;

        const scrollComponentStyle: React.CSSProperties = {
            width: `${width}px`,
            height: `${height + 20}px`, //20px to push the scroll element down off screen...?
            top: `${top}px`,
            cursor: isDragging ? "move" : "default",
            position: "relative",
        };

        return (
            <div
                ref={this.refHandler}
                data-testid="scroll-element"
                className="rct-scroll"
                style={scrollComponentStyle}
                onMouseDown={this.handleMouseDown}
                onMouseMove={this.handleMouseMove}
                onMouseUp={this.handleMouseUp}
                onMouseLeave={this.handleMouseLeave}
                onTouchStart={this.handleTouchStart}
                onTouchMove={this.handleTouchMove}
                onTouchEnd={this.handleTouchEnd}
                onScroll={this.handleScroll}
            >
                {children}
            </div>
        );
    }
}
