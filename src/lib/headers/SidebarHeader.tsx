import React from "react";
import { TimelineHeadersConsumer } from "./HeadersContext";

export interface ISidebarHeaderChildrenFnProps<T> {
    getRootProps: (propsToOverride: { style: React.CSSProperties }) => { style: React.CSSProperties };
    data: T;
}

export interface ISidebarWrapperProps<T> {
    variant: "left" | "right";
    headerData: T;
    children: (props: ISidebarHeaderChildrenFnProps<T>) => JSX.Element;
}

export interface ISidebarHeaderProps<T> extends ISidebarWrapperProps<T> {
    rightSidebarWidth?: number;
    leftSidebarWidth: number;
    style?: React.CSSProperties;
}

class SidebarHeader<T> extends React.PureComponent<ISidebarHeaderProps<T>> {
    getRootProps = (props: { style?: React.CSSProperties } = {}) => {
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

const defaultSidebarHeaderChildren = ({ getRootProps }: ISidebarHeaderChildrenFnProps<unknown>) => (
    <div data-testid="sidebarHeader" {...getRootProps({ style: {} })} />
);

function SidebarWrapper<T>(props: ISidebarWrapperProps<T>): React.ReactNode {
    const { children = defaultSidebarHeaderChildren, variant = "left", headerData } = props;
    return (
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
}

SidebarWrapper.secretKey = "SidebarHeader";

export default SidebarWrapper;
