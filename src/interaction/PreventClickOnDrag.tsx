import React from "react";

type RenderChildrenArgs = {
    onClick: (event: React.MouseEvent) => void;
    onMouseDown: (event: React.MouseEvent) => void;
    onMouseUp: (event: React.MouseEvent) => void;
};

type Props = {
    onClick: (event: React.MouseEvent) => void;
    clickTolerance: number;
    renderChildren: (args: RenderChildrenArgs) => React.ReactNode;
};

export class PreventClickOnDrag extends React.Component<Props> {
    private cancelClick: boolean = false;
    private originClickX: number | null = null;

    handleMouseDown = (event: React.MouseEvent) => {
        this.originClickX = event.clientX;
    };

    handleMouseUp = (event: React.MouseEvent) => {
        if (this.originClickX !== null && Math.abs(this.originClickX - event.clientX) > this.props.clickTolerance) {
            this.cancelClick = true;
        }
    };

    handleClick = (event: React.MouseEvent) => {
        if (!this.cancelClick) {
            this.props.onClick(event);
        }

        this.cancelClick = false;
        this.originClickX = null;
    };

    render() {
        return this.props.renderChildren({
            onClick: this.handleClick,
            onMouseDown: this.handleMouseDown,
            onMouseUp: this.handleMouseUp,
        });
    }
}
