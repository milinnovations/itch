import React from "react";
import { SidebarHeaderChildrenFnProps, SidebarHeaderProps } from "../types";
import { TimelineHeadersConsumer } from "./HeadersContext";

type WrappedSidebarHeaderProps<T> = SidebarHeaderProps<T> & {
    rightSidebarWidth?: number;
    leftSidebarWidth: number;
    style?: React.CSSProperties;
    children: (props: SidebarHeaderChildrenFnProps<T>) => JSX.Element;
};

class SidebarHeader<T> extends React.PureComponent<WrappedSidebarHeaderProps<T>> {
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

    getStateAndHelpers = (): SidebarHeaderChildrenFnProps<T> => {
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

const defaultSidebarHeaderChildren = ({ getRootProps }: SidebarHeaderChildrenFnProps<unknown>) => (
    <div data-testid="sidebarHeader" {...getRootProps({ style: {} })} />
);

function SidebarWrapper<T>(props: SidebarHeaderProps<T>): JSX.Element {
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
