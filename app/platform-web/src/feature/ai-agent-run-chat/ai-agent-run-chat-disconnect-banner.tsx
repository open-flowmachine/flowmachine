import { RefreshCcwIcon } from "lucide-react";

import { Button } from "@/component/ui/button";

type AiAgentRunChatDisconnectBannerProps = {
  onReconnect: () => void;
};

export function AiAgentRunChatDisconnectBanner({
  onReconnect,
}: AiAgentRunChatDisconnectBannerProps) {
  return (
    <div className="border-destructive/40 bg-destructive/10 text-destructive flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
      <span>
        Connection lost. New events will not appear until you reconnect.
      </span>
      <Button variant="outline" size="sm" onClick={onReconnect}>
        <RefreshCcwIcon />
        Reconnect
      </Button>
    </div>
  );
}
