"use client";

// ---------------------------------------------------------------------------
// A tiny, dependency-free Markdown renderer for AI prose (Copilot answers,
// the daily briefing, coverage answers). Handles the subset the model emits:
// headings, bullet/numbered lists (one level of nesting), horizontal rules,
// bold/italic/inline-code/links, and paragraphs. Not a full CommonMark parser
// — deliberately small and safe (no dangerouslySetInnerHTML).
// ---------------------------------------------------------------------------

import { type ReactNode } from "react";

const INLINE =
  /(\*\*([^*]+?)\*\*|__([^_]+?)__|`([^`]+?)`|\*([^*]+?)\*|_([^_]+?)_|\[([^\]]+?)\]\(([^)\s]+?)\))/g;

/** Parse a single line of inline markdown into styled React nodes. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[2] !== undefined || m[3] !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold text-ink">
          {m[2] ?? m[3]}
        </strong>
      );
    } else if (m[4] !== undefined) {
      out.push(
        <code
          key={key++}
          className="rounded bg-panel px-1 py-0.5 font-mono text-[0.9em] text-ink ring-1 ring-line"
        >
          {m[4]}
        </code>
      );
    } else if (m[5] !== undefined || m[6] !== undefined) {
      out.push(<em key={key++}>{m[5] ?? m[6]}</em>);
    } else if (m[7] !== undefined) {
      out.push(
        <a
          key={key++}
          href={m[8]}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {m[7]}
        </a>
      );
    }
    last = INLINE.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

interface ListItem {
  text: string;
  children: ListItem[];
  ordered: boolean;
}

interface FlatItem {
  indent: number;
  ordered: boolean;
  text: string;
}

/** Build a nested list tree from flat, indent-tagged items. */
function buildList(
  items: FlatItem[],
  start: number,
  indent: number
): [ListItem[], boolean, number] {
  const nodes: ListItem[] = [];
  const ordered = items[start].ordered;
  let i = start;
  while (i < items.length && items[i].indent >= indent) {
    if (items[i].indent > indent) {
      const [children, , next] = buildList(items, i, items[i].indent);
      if (nodes.length) nodes[nodes.length - 1].children = children;
      i = next;
    } else {
      nodes.push({ text: items[i].text, children: [], ordered });
      i++;
    }
  }
  return [nodes, ordered, i];
}

function renderList(nodes: ListItem[], key: number): ReactNode {
  const ordered = nodes[0]?.ordered;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag
      key={key}
      className={`my-1.5 space-y-1 ${
        ordered ? "list-decimal" : "list-disc"
      } pl-5 marker:text-ink-faint`}
    >
      {nodes.map((n, idx) => (
        <li key={idx} className="leading-relaxed">
          {inline(n.text)}
          {n.children.length > 0 && renderList(n.children, idx)}
        </li>
      ))}
    </Tag>
  );
}

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

export function Markdown({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const lines = (text ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let key = 0;
  let i = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={key++} className="leading-relaxed">
          {inline(para.join(" "))}
        </p>
      );
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) {
      flushPara();
      i++;
      continue;
    }

    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushPara();
      blocks.push(<hr key={key++} className="my-3 border-line" />);
      i++;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      const level = h[1].length;
      const content = inline(h[2]);
      const cls =
        level <= 1
          ? "mb-1 mt-1 font-display text-base font-bold text-ink"
          : level === 2
          ? "mb-1 mt-2 font-display text-[15px] font-bold text-ink"
          : "mb-0.5 mt-1.5 text-[13px] font-semibold uppercase tracking-wide text-ink-soft";
      blocks.push(
        <p key={key++} className={cls}>
          {content}
        </p>
      );
      i++;
      continue;
    }

    if (LIST_RE.test(line)) {
      flushPara();
      const flat: FlatItem[] = [];
      while (i < lines.length && LIST_RE.test(lines[i])) {
        const lm = lines[i].match(LIST_RE)!;
        flat.push({
          indent: lm[1].length,
          ordered: /\d/.test(lm[2]),
          text: lm[3],
        });
        i++;
      }
      const baseIndent = Math.min(...flat.map((f) => f.indent));
      const [nodes] = buildList(flat, 0, baseIndent);
      blocks.push(renderList(nodes, key++));
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara();

  return <div className={`space-y-1.5 ${className}`}>{blocks}</div>;
}
