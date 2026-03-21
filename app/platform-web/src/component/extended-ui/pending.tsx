import { Spinner } from "@/component/ui/spinner";

type PendingProps = {
  message?: string;
};

export function Pending({ message }: PendingProps) {
  return (
    <div className="flex items-center gap-2">
      <Spinner />
      <p>{message ?? "Loading..."}</p>
    </div>
  );
}
