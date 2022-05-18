import React from "react";
import moment from "moment";

import Timeline from "../src";
import type { TimelineGroupBase, TimelineItemBase } from "../src/types";
import "../src/Timeline.scss";

const groups: TimelineGroupBase[] = [];

for (let id = 0; id < 2000; id++) {
    groups.push({ id: id.toString(), title: `Group ${id}` });
}

const items: TimelineItemBase[] = [];

type RelativeTimeWindow = {
    startOffset: number;
    duration: number;
};

const rowDefinitions: RelativeTimeWindow[][] = [
    [
        {
            startOffset: -2,
            duration: 1,
        },
        {
            startOffset: 0,
            duration: 2,
        },
        {
            startOffset: 3,
            duration: 2,
        },
    ],
    [
        {
            startOffset: -1,
            duration: 4,
        },
        {
            startOffset: 4,
            duration: 3,
        },
    ],
];

const _baseDate = moment().startOf("hour");
// Moment objects are mutable, use a factory to get mutable copy of the base date...
const getBaseDate = () => moment(_baseDate);

for (let group = 0; group < groups.length; group++) {
    const rowDefinition = rowDefinitions[group % rowDefinitions.length];
    for (let item = 0; item < rowDefinition.length; item++) {
        const itemDefinition = rowDefinition[item];
        const start = getBaseDate().add(itemDefinition.startOffset, "hour");
        // Moment objects are mutable, create a clone.
        const end = moment(start).add(itemDefinition.duration, "hour");
        items.push({
            id: `${group}-${item}`,
            group: group.toString(),
            title: `Group ${group} / Item ${item}`,
            start_time: start.valueOf(),
            end_time: end.valueOf(),
        });
    }
}

/**
 * Primary UI component for user interaction
 */
export const Itch = ({}: {
    /* Empty */
}): JSX.Element => {
    return (
        <div>
            <Timeline
                groups={groups}
                items={items}
                defaultTimeStart={getBaseDate().add(-12, "hour")}
                defaultTimeEnd={getBaseDate().add(12, "hour")}
            />
        </div>
    );
};
