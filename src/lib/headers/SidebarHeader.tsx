import React from "react";
import PropTypes from "prop-types";
import { TimelineHeadersConsumer } from "./HeadersContext";

export interface ISidebarHeaderChildrenFnProps<T> {
    getRootProps: (propsToOverride: { style: React.CSSProperties }) => { style: React.CSSProperties };
    data: T;
}

export interface ISidebarHeaderProps<T> {
    rightSidebarWidth?: number;
    leftSidebarWidth: number;
    variant: "left" | "right";
    headerData: T;
    children: (props: ISidebarHeaderChildrenFnProps<T>) => JSX.Element;
    style?: React.CSSProperties;
}

class SidebarHeader<T> extends React.PureComponent<ISidebarHeaderProps<T>> {
    getRootProps = (props: { style: React.CSSProperties }) => {
        const { style = {} } = props;
        const width = this.props.variant === "right" ? this.props.rightSidebarWidth : this.props.leftSidebarWidth;
        return {
            style: {
                ...style,
                width,
            },
        };
    };

    getStateAndHelpers = () => {
        return {
            getRootProps: this.getRootProps,
            data: this.props.headerData,
        };
    };

    render() {
        const renderProps = this.getStateAndHelpers();
        const Renderer = this.props.children;
        return <Renderer {...renderProps} />;
    }
}

const SidebarWrapper = ({ children, variant, headerData }) => (
    <TimelineHeadersConsumer>
        {({ leftSidebarWidth, rightSidebarWidth }) => {
            return (
                <SidebarHeader
                    leftSidebarWidth={leftSidebarWidth}
                    rightSidebarWidth={rightSidebarWidth}
                    children={children}
                    variant={variant}
                    headerData={headerData}
                />
            );
        }}
    </TimelineHeadersConsumer>
);

SidebarWrapper.propTypes = {
    children: PropTypes.func.isRequired,
    variant: PropTypes.string,
    headerData: PropTypes.object,
};

SidebarWrapper.defaultProps = {
    variant: "left",
    children: ({ getRootProps }) => <div data-testid="sidebarHeader" {...getRootProps()} />,
};

SidebarWrapper.secretKey = "SidebarHeader";

export default SidebarWrapper;
