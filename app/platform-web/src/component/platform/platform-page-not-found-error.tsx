import { CircleXIcon, RefreshCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Center } from "@/component/extended-ui/center";
import { Button } from "@/component/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/component/ui/empty";

export function PlatformPageNotFoundError() {
  const router = useRouter();

  const handleRefreshButtonClick = () => {
    router.refresh();
  };

  return (
    <Center>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleXIcon />
          </EmptyMedia>
          <EmptyTitle>404 - Not Found</EmptyTitle>
          <EmptyDescription>
            The page you&apos;re looking for might not exist. Try refresh the
            page again.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={handleRefreshButtonClick}>
            <RefreshCcwIcon />
            Refresh
          </Button>
        </EmptyContent>
      </Empty>
    </Center>
  );
}
