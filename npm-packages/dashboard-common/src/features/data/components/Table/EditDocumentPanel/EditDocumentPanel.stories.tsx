import { Meta, StoryObj } from "@storybook/react";
import { ConvexProvider } from "convex/react";
import React from "react";
import udfs from "udfs";
import { EditDocumentPanel } from "features/data/components/Table/EditDocumentPanel/EditDocumentPanel";
import { mockConvexReactClient } from "lib/mockConvexReactClient";

const mockClient = mockConvexReactClient()
  .registerQueryFake(udfs.listById.default, ({ ids }) => ids.map(() => null))
  .registerQueryFake(udfs.components.list, () => [])
  .registerQueryFake(udfs.getTableMapping.default, () => ({}));

export default {
  component: EditDocumentPanel,
  render: (args) => (
    <ConvexProvider client={mockClient}>
      <EditDocumentPanel {...args} />
    </ConvexProvider>
  ),
} as Meta<typeof EditDocumentPanel>;

export const Adding: StoryObj<typeof EditDocumentPanel> = {
  args: { defaultDocument: {} },
};

export const Editing: StoryObj<typeof EditDocumentPanel> = {
  args: { defaultDocument: { abc: 1, def: "ghi" } },
};
