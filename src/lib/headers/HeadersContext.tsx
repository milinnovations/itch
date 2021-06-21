import React from "react";
import { noop } from "../utility/generic";

// TODO: Find a better place for this interface once we use it in more files.
export interface ITimeSteps {
    second?: number;
    minute?: number;
    hour?: number;
    day?: number;
    month?: number;
    year?: number;
}

export interface IHeaderContext {
    timeSteps: ITimeSteps;
    rightSidebarWidth: number;
    leftSidebarWidth: number;
    registerScroll: React.RefCallback<HTMLElement>;
}

export interface ITimelineHeadersProviderProps extends IHeaderContext {
    children: JSX.Element;
}

const defaultContextState: IHeaderContext = {
    registerScroll: () => {
        // eslint-disable-next-line
        console.warn("default registerScroll header used");
        return noop;
    },
    rightSidebarWidth: 0,
    leftSidebarWidth: 150,
    timeSteps: {},
};

const { Consumer, Provider } = React.createContext(defaultContextState);

export class TimelineHeadersProvider extends React.Component<ITimelineHeadersProviderProps> {
    render(): React.ReactNode {
        const contextValue = {
            rightSidebarWidth: this.props.rightSidebarWidth,
            leftSidebarWidth: this.props.leftSidebarWidth,
            timeSteps: this.props.timeSteps,
            registerScroll: this.props.registerScroll,
        };
        return <Provider value={contextValue}>{this.props.children}</Provider>;
    }
}

export const TimelineHeadersConsumer = Consumer;
