import type { ColumnDef } from "@tanstack/react-table";

import Link from "next/link";

import type { AiAgentRun } from "@/module/ai-agent-run/ai-agent-run-type";

import { DataTableColumnHeader } from "@/component/extended-ui/data-table";
import { Badge } from "@/component/ui/badge";
import { makeAiAgentRunService } from "@/module/ai-agent-run/ai-agent-run-service";

type MakeAiAgentRunsTableColumnDefInput = {
  aiAgentId: string;
};

export const makeAiAgentRunsTableColumnDef = ({
  aiAgentId,
}: MakeAiAgentRunsTableColumnDefInput) => {
  return [
    {
      accessorKey: "startedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started" />
      ),
      cell: ({ row }) => {
        const service = makeAiAgentRunService({ run: row.original });
        return (
          <Link
            href={`/platform/ai-agent/${aiAgentId}/run/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {service.getStartedAt() ?? "—"}
          </Link>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const service = makeAiAgentRunService({ run: row.original });
        return (
          <Badge variant={service.getStatusBadgeVariant()}>
            {service.getStatusDisplayName()}
          </Badge>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "lastMessageAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last message" />
      ),
      cell: ({ row }) => {
        const service = makeAiAgentRunService({ run: row.original });
        return <span>{service.getLastMessageAt() ?? "—"}</span>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "endedReason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ended reason" />
      ),
      cell: ({ row }) => {
        const service = makeAiAgentRunService({ run: row.original });
        return <span>{service.getEndedReasonDisplayName() ?? "—"}</span>;
      },
      enableSorting: false,
    },
  ] satisfies ColumnDef<AiAgentRun>[];
};
