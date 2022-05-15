import React from "react";
import { TimelineHeadersConsumer } from "./HeadersContext";

export interface ISidebarHeaderChildrenFnProps<T> {
    getRootProps: (propsToOverride: { style: React.CSSProperties }) => { style: React.CSSProperties };
    data?: T; // TODO: I had to make this optional, please check it later
}

export interface ISidebarWrapperProps<T> {
    variant?: "left" | "right";
    headerData?: T;
    children?: (props: ISidebarHeaderChildrenFnProps<T>) => JSX.Element;
}

export interface ISidebarHeaderProps<T> extends ISidebarWrapperProps<T> {
    rightSidebarWidth?: number;
    leftSidebarWidth: number;
    style?: React.CSSProperties;
    children: (props: ISidebarHeaderChildrenFnProps<T>) => JSX.Element;
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

    getStateAndHelpers = (): ISidebarHeaderChildrenFnProps<T> => {
        return {
            getRootProps: this.getRootProps,
            data: this.props.headerData,
        };
    };

    render() {
        const renderProps = this.getStateAndHelpers();
        const renderer = this.props.children;
        return renderer(renderProps);
    }
}

const defaultSidebarHeaderChildren = ({ getRootProps }: ISidebarHeaderChildrenFnProps<unknown>) => (
    <div data-testid="sidebarHeader" {...getRootProps({ style: {} })} />
);

function SidebarWrapper<T>(props: ISidebarWrapperProps<T>): JSX.Element {
    const { children = defaultSidebarHeaderChildren, variant = "left", headerData } = props;
    return (
        <TimelineHeadersConsumer>
            {({ leftSidebarWidth, rightSidebarWidth }) => {
                return (
                    <SidebarHeader
                        leftSidebarWidth={leftSidebarWidth}
                        rightSidebarWidth={rightSidebarWidth}
                        // eslint-disable-next-line react/no-children-prop
                        children={children} // TODO: This seems a bad programming practice, it should be refactored
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
