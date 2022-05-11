import React, { Component } from "react";
import PropTypes from "prop-types";
import PreventClickOnDrag from "../interaction/PreventClickOnDrag";

class GroupRow extends Component {
    static propTypes = {
        onClick: PropTypes.func.isRequired,
        onContextMenu: PropTypes.func.isRequired,
        onDoubleClick: PropTypes.func.isRequired,
        onDrop: PropTypes.func,
        isEvenRow: PropTypes.bool.isRequired,
        style: PropTypes.object.isRequired,
        clickTolerance: PropTypes.number.isRequired,
        group: PropTypes.object.isRequired,
        horizontalLineClassNamesForGroup: PropTypes.func,
    };

    handleDragOver = e => {
        if (this.props.onDrop !== undefined) {
            e.preventDefault();
        }
    };

    render() {
        const {
            onContextMenu,
            onDoubleClick,
            onDrop,
            isEvenRow,
            style,
            onClick,
            clickTolerance,
            horizontalLineClassNamesForGroup,
            group,
        } = this.props;

        let classNamesForGroup = [];
        if (horizontalLineClassNamesForGroup) {
            classNamesForGroup = horizontalLineClassNamesForGroup(group);
        }

        return (
            <PreventClickOnDrag clickTolerance={clickTolerance} onClick={onClick}>
                <div
                    onContextMenu={onContextMenu}
                    onDoubleClick={onDoubleClick}
                    onDragOver={this.handleDragOver}
                    onDrop={onDrop}
                    className={
                        (isEvenRow ? "rct-hl-even " : "rct-hl-odd ") +
                        (classNamesForGroup ? classNamesForGroup.join(" ") : "")
                    }
                    style={style}
                />
            </PreventClickOnDrag>
        );
    }
}

export default GroupRow;
