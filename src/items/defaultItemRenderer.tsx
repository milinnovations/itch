import React from "react";

import type { ItemContext, ItemRendererResizeProps, ResizeStyles, TimelineItemBase, TimelineItemProps } from "../types";

type Props<TItem extends TimelineItemBase> = {
    item: TItem;
    itemContext: ItemContext;
    getItemProps: (itemProps?: Partial<Omit<TimelineItemProps, "key" | "ref">>) => TimelineItemProps;
    getResizeProps: (styles?: ResizeStyles) => ItemRendererResizeProps;
};

export function defaultItemRenderer<TItem extends TimelineItemBase>(props: Props<TItem>) {
    const { item, itemContext, getItemProps, getResizeProps } = props;
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
    return (
        <div {...getItemProps(item.itemProps)}>
            {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : ""}

            <div className="rct-item-content" style={{ maxHeight: `${itemContext.dimensions.height}` }}>
                {itemContext.title}
            </div>

            {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : ""}
        </div>
    );
}
