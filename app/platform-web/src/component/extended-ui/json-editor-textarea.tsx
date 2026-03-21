"use client";

import { isString } from "es-toolkit";
import { useRef } from "react";
import { Textarea } from "@/component/ui/textarea";
import { cn } from "@/lib/util";

export function JsonEditorTextarea({
  className,
  ...rest
}: React.ComponentProps<"textarea">) {
  const lineNumberEl = useRef<HTMLDivElement>(null);
  const lineCount = isString(rest.value) ? rest.value.split("\n").length : 1;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumberEl.current) {
      console.log(e.currentTarget.scrollTop);
      lineNumberEl.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="bg-muted/30 flex h-full overflow-auto rounded-lg border">
      <div
        className="bg-muted/50 h-fit min-h-full border-r py-2 pr-2 pl-3 text-right select-none"
        ref={lineNumberEl}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i + 1}
            className="text-muted-foreground font-mono text-xs leading-6 font-medium"
          >
            {i + 1}
          </div>
        ))}
      </div>
      <Textarea
        className={cn(
          "h-fit min-h-full resize-none rounded-br-lg border-0 font-mono leading-6",
          className,
        )}
        placeholder="Paste or type your JSON here..."
        onScroll={handleScroll}
        rows={lineCount}
        spellCheck={false}
        {...rest}
      />
    </div>
  );
}
