import React, { Component } from "react";
import PropTypes from "prop-types";
import { getParentPosition } from "../utility/dom-helpers";

class ScrollElement extends Component {
    static ZOOM_SPEED = {
        alt: 1,
        meta: 2,
        ctrl: 2,
    };

    static propTypes = {
        children: PropTypes.element.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        traditionalZoom: PropTypes.bool.isRequired,
        scrollRef: PropTypes.func.isRequired,
        isInteractingWithItem: PropTypes.bool.isRequired,
        onZoom: PropTypes.func.isRequired,
        onWheelZoom: PropTypes.func.isRequired,
        onHorizontalScroll: PropTypes.func.isRequired,
        onVerticalScrollBy: PropTypes.func.isRequired,
        zoomSpeed: PropTypes.object,
    };

    constructor() {
        super();
        this.state = {
            isDragging: false,
        };
    }

    /**
     * needed to handle scrolling with trackpad
     */
    handleScroll = () => {
        const scrollX = this.scrollComponent.scrollLeft;
        this.props.onHorizontalScroll(scrollX);
    };

    refHandler = el => {
        this.scrollComponent = el;
        this.props.scrollRef(el);
        if (el) {
            el.addEventListener("wheel", this.handleWheel, { passive: false });
        }
    };

    handleWheel = e => {
        const { traditionalZoom } = this.props;

        // zoom in the time dimension
        if (e.ctrlKey || e.metaKey || e.altKey) {
            e.preventDefault();
            const parentPosition = getParentPosition(e.currentTarget);
            const xPosition = e.clientX - parentPosition.x;

            const speeds = this.props.zoomSpeed ?? ScrollElement.ZOOM_SPEED;
            const speed = e.ctrlKey ? speeds.ctrl : e.metaKey ? speeds.meta : speeds.alt;

            // convert vertical zoom to horiziontal
            this.props.onWheelZoom(speed, xPosition, e.deltaY);
        } else if (e.shiftKey) {
            e.preventDefault();
            // shift+scroll event from a touchpad has deltaY property populated; shift+scroll event from a mouse has deltaX
            this.props.onHorizontalScroll(this.scrollComponent.scrollLeft + (e.deltaY || e.deltaX));
            // no modifier pressed? we prevented the default event, so scroll or zoom as needed
        }
    };

    handleMouseDown = e => {
        if (e.isDefaultPrevented()) return;

        if (e.button === 0) {
            this.setState({
                isDragging: true,
            });
            e.preventDefault();
        }
    };

    handleMouseMove = e => {
        // this.props.onMouseMove(e)
        //why is interacting with item important?
        if (this.state.isDragging && !this.props.isInteractingWithItem) {
            this.props.onHorizontalScroll(this.scrollComponent.scrollLeft - e.movementX);
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

    handleTouchStart = e => {
        if (e.touches.length === 2) {
            e.preventDefault();

            this.lastTouchDistance = Math.abs(e.touches[0].screenX - e.touches[1].screenX);
            this.singleTouchStart = null;
            this.lastSingleTouch = null;
        } else if (e.touches.length === 1) {
            e.preventDefault();

            let x = e.touches[0].clientX;
            let y = e.touches[0].clientY;

            this.lastTouchDistance = null;
            this.singleTouchStart = { x: x, y: y, screenY: window.pageYOffset };
            this.lastSingleTouch = { x: x, y: y, screenY: window.pageYOffset };
        }
    };

    handleTouchMove = e => {
        const { isInteractingWithItem, width, onZoom } = this.props;
        if (isInteractingWithItem) {
            e.preventDefault();
            return;
        }
        if (this.lastTouchDistance && e.touches.length === 2) {
            e.preventDefault();
            let touchDistance = Math.abs(e.touches[0].screenX - e.touches[1].screenX);
            let parentPosition = getParentPosition(e.currentTarget);
            let xPosition = (e.touches[0].screenX + e.touches[1].screenX) / 2 - parentPosition.x;
            if (touchDistance !== 0 && this.lastTouchDistance !== 0) {
                onZoom(this.lastTouchDistance / touchDistance, xPosition / width);
                this.lastTouchDistance = touchDistance;
            }
        } else if (this.lastSingleTouch && e.touches.length === 1) {
            e.preventDefault();
            let x = e.touches[0].clientX;
            let y = e.touches[0].clientY;
            let deltaX = x - this.lastSingleTouch.x;
            let deltaX0 = x - this.singleTouchStart.x;
            let deltaY0 = y - this.singleTouchStart.y;
            this.lastSingleTouch = { x: x, y: y };
            let moveX = Math.abs(deltaX0) * 3 > Math.abs(deltaY0);
            let moveY = Math.abs(deltaY0) * 3 > Math.abs(deltaX0);
            if (deltaX !== 0 && moveX) {
                this.props.onHorizontalScroll(this.scrollComponent.scrollLeft - deltaX);
            }
            if (moveY) {
                window.scrollTo(window.pageXOffset, this.singleTouchStart.screenY - deltaY0);
            }
        }
    };

    handleTouchEnd = () => {
        if (this.lastTouchDistance) {
            this.lastTouchDistance = null;
        }
        if (this.lastSingleTouch) {
            this.lastSingleTouch = null;
            this.singleTouchStart = null;
        }
    };

    componentWillUnmount() {
        if (this.scrollComponent) {
            this.scrollComponent.removeEventListener("wheel", this.handleWheel);
        }
    }

    render() {
        const { width, height, children } = this.props;
        const { isDragging } = this.state;

        const scrollComponentStyle = {
            width: `${width}px`,
            height: `${height + 20}px`, //20px to push the scroll element down off screen...?
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

export default ScrollElement;
