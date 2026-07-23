"use client";

import { Button, Card, Eyebrow } from "./ui";
import { usePrefs } from "./prefs";
import {
  IconArrowRight,
  IconBox,
  IconCheckCircle,
  IconClipboard,
  IconClock,
  IconDoc,
  IconGrid,
  IconPlane,
  IconPlus,
  IconSparkles,
  IconUsers,
  IconPaw,
} from "./icons";

function download() {
  if (typeof window !== "undefined") window.print();
}

/**
 * Renders a translated string with markdown-lite emphasis:
 * `**bold**` → <strong>, `*italic*` → <em>, `` `mono` `` → monospace span.
 * Lets translations carry the same emphasis the English copy had.
 */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**"))
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith("`") && p.endsWith("`"))
          return (
            <span key={i} className="font-mono text-[12px]">
              {p.slice(1, -1)}
            </span>
          );
        if (p.startsWith("*") && p.endsWith("*"))
          return <em key={i}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

const STEPS: { icon: (p: { width?: number; height?: number }) => JSX.Element; key: string }[] = [
  { icon: IconGrid, key: "dashboard" },
  { icon: IconPlus, key: "newbooking" },
  { icon: IconSparkles, key: "extraction" },
  { icon: IconBox, key: "booking" },
  { icon: IconPlane, key: "readiness" },
  { icon: IconCheckCircle, key: "submissions" },
  { icon: IconSparkles, key: "update" },
  { icon: IconDoc, key: "artifacts" },
  { icon: IconClock, key: "timeline" },
  { icon: IconUsers, key: "staffing" },
  { icon: IconBox, key: "housing" },
  { icon: IconPaw, key: "animals" },
  { icon: IconSparkles, key: "copilot" },
  { icon: IconClipboard, key: "rules" },
  { icon: IconArrowRight, key: "portal" },
  { icon: IconClipboard, key: "requirements" },
];

const AROUND = ["dashboard", "new", "housing", "animals", "staffing", "copilot", "portal", "requirements"];
const START = ["1", "2", "3", "4", "5", "6"];
const BEFORE = ["1", "2", "3", "4"];
const AFTER = ["1", "2", "3", "4"];
const IMPORT = ["1", "2", "3", "4", "5"];
const EXPORT = ["1", "2", "3", "4", "5"];
const KNOW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17"];

export function Guide() {
  const { t } = usePrefs();
  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>{t("guide.eyebrow")}</Eyebrow>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">
            {t("guide.title")}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-ink-soft">
            {t("guide.subtitle")}
          </p>
        </div>
        <span className="no-print">
          <Button onClick={download}>
            <IconDoc width={16} height={16} />
            {t("guide.download")}
          </Button>
        </span>
      </div>

      {/* What it is */}
      <Card className="print-plain mb-5 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("guide.what.title")}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          <RichText text={t("guide.what.body")} />
        </p>
      </Card>

      {/* Before vs after */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="print-plain border-line-strong p-5">
          <div className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
            {t("guide.before.title")}
          </div>
          <ul className="mt-2 space-y-1.5 text-[13.5px] text-ink-soft">
            {BEFORE.map((n) => (
              <li key={n}>• {t(`guide.before.${n}`)}</li>
            ))}
          </ul>
        </Card>
        <Card className="print-plain border-primary/30 p-5">
          <div className="font-mono text-[11px] uppercase tracking-wide text-primary">
            {t("guide.after.title")}
          </div>
          <ul className="mt-2 space-y-1.5 text-[13.5px] text-ink">
            {AFTER.map((n) => (
              <li key={n}>• {t(`guide.after.${n}`)}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Getting around */}
      <Card className="print-plain mb-5 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("guide.around.title")}
        </h2>
        <p className="mt-1 text-[13.5px] text-ink-soft">{t("guide.around.intro")}</p>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 text-[13.5px] text-ink-soft sm:grid-cols-2">
          {AROUND.map((k) => (
            <li key={k}>
              <RichText text={t(`guide.around.${k}`)} />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] text-ink-faint">
          <RichText text={t("guide.around.note")} />
        </p>
      </Card>

      {/* Ways to create a job */}
      <Card className="print-plain mb-5 p-5">
        <h2 className="font-display text-lg font-bold text-ink">
          {t("guide.start.title")}
        </h2>
        <ol className="mt-2 grid grid-cols-1 gap-1.5 text-[13.5px] text-ink-soft sm:grid-cols-2">
          {START.map((n) => (
            <li key={n}>
              {n}. <RichText text={t(`guide.start.${n}`)} />
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[13px] text-ink-faint">
          <RichText text={t("guide.start.note")} />
        </p>
      </Card>

      {/* The screens / flow */}
      <div className="mb-5">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">
          {t("guide.screens.title")}
        </h2>
        <div className="stagger space-y-2.5">
          {STEPS.map((s) => (
            <Step
              key={s.key}
              icon={s.icon}
              title={t(`guide.step.${s.key}.title`)}
              body={t(`guide.step.${s.key}.body`)}
            />
          ))}
        </div>
      </div>

      {/* How to operate */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="print-plain p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <IconArrowRight width={16} height={16} />
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              {t("guide.import.title")}
            </h3>
          </div>
          <ol className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink-soft">
            {IMPORT.map((n) => (
              <li key={n}>
                {n}. <RichText text={t(`guide.import.${n}`)} />
              </li>
            ))}
          </ol>
        </Card>

        <Card className="print-plain p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <IconPlane width={16} height={16} />
            </span>
            <h3 className="font-display text-base font-bold text-ink">
              {t("guide.export.title")}
            </h3>
          </div>
          <ol className="mt-3 space-y-2 text-[13.5px] leading-relaxed text-ink-soft">
            {EXPORT.map((n) => (
              <li key={n}>
                {n}. <RichText text={t(`guide.export.${n}`)} />
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {/* Good to know */}
      <Card className="print-plain mt-4 p-5">
        <h3 className="font-display text-base font-bold text-ink">
          {t("guide.know.title")}
        </h3>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[13.5px] leading-relaxed text-ink-soft sm:grid-cols-2">
          {KNOW.map((n) => (
            <li key={n}>
              <RichText text={t(`guide.know.${n}`)} />
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-5 text-center font-mono text-[11px] text-ink-faint">
        {t("guide.tip")}
      </p>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: (p: { width?: number; height?: number }) => JSX.Element;
  title: string;
  body: string;
}) {
  return (
    <Card className="print-plain flex items-start gap-3 p-4">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-primary">
        <Icon width={18} height={18} />
      </span>
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-soft">
          {body}
        </p>
      </div>
    </Card>
  );
}
