import { Fragment, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const token = /(\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = token.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${i++}`}>{text.slice(last, match.index)}</Fragment>
      );
    }
    const raw = match[0];
    if (raw.startsWith("**") || raw.startsWith("__")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i++}`} className="font-semibold">
          {raw.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(
        <code
          key={`${keyPrefix}-c-${i++}`}
          className="rounded bg-black/10 px-1 py-0.5 text-[0.85em] font-mono"
        >
          {raw.slice(1, -1)}
        </code>
      );
    }
    last = match.index + raw.length;
  }

  if (last < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t-${i++}`}>{text.slice(last)}</Fragment>);
  }

  return nodes;
}

function headingLevel(line: string): { level: number; text: string } | null {
  const match = /^(#{1,6})\s+(.+)$/.exec(line);
  if (!match) return null;
  return { level: match[1].length, text: match[2].trim() };
}

function listItem(line: string): { ordered: boolean; text: string } | null {
  const unordered = /^\s*[-*•]\s+(.+)$/.exec(line);
  if (unordered) return { ordered: false, text: unordered[1] };
  const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
  if (ordered) return { ordered: true, text: ordered[1] };
  return null;
}

export function MarkdownMessage({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let key = 0;

  const flushList = (items: { ordered: boolean; text: string }[]) => {
    if (items.length === 0) return;
    const ordered = items[0].ordered;
    const ListTag = ordered ? "ol" : "ul";
    blocks.push(
      <ListTag
        key={`list-${key++}`}
        className={cn(
          "my-2 space-y-1 pl-5 text-sm",
          ordered ? "list-decimal" : "list-disc",
        )}
      >
        {items.map((item, idx) => (
          <li key={idx} className="leading-relaxed">
            {renderInline(item.text, `li-${key}-${idx}`)}
          </li>
        ))}
      </ListTag>
    );
  };

  let listBuffer: { ordered: boolean; text: string }[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const heading = headingLevel(trimmed);
    const item = listItem(line);

    if (item) {
      if (listBuffer.length > 0 && listBuffer[0].ordered !== item.ordered) {
        flushList(listBuffer);
        listBuffer = [];
      }
      listBuffer.push(item);
      continue;
    }

    if (listBuffer.length > 0) {
      flushList(listBuffer);
      listBuffer = [];
    }

    if (trimmed === "") {
      blocks.push(<div key={`sp-${key++}`} className="h-2" />);
      continue;
    }

    if (heading) {
      const Tag = (`h${Math.min(heading.level, 4)}` as unknown) as "h2" | "h3" | "h4";
      const headingClass =
        heading.level <= 2
          ? "mt-3 mb-1 text-base font-semibold tracking-tight"
          : "mt-3 mb-1 text-sm font-semibold tracking-tight";
      blocks.push(
        <Tag key={`h-${key++}`} className={headingClass}>
          {renderInline(heading.text, `h-${key}`)}
        </Tag>
      );
      continue;
    }

    blocks.push(
      <p key={`p-${key++}`} className="text-sm leading-relaxed break-words">
        {renderInline(line, `p-${key}`)}
      </p>
    );
  }

  if (listBuffer.length > 0) {
    flushList(listBuffer);
  }

  return <div className={cn("space-y-0.5", className)}>{blocks}</div>;
}
