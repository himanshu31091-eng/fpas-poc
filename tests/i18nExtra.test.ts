import { describe, it, expect } from "vitest";
import { DICT, translate, LANGS, type Lang } from "@/lib/i18n";
import { EXTRA_DICT } from "@/lib/i18nExtra";
import { SECTIONS, STATUS_META } from "@/lib/requirements";

const LANG_IDS = LANGS.map((l) => l.id) as Lang[];

describe("i18nExtra · dictionary completeness", () => {
  it("every extended entry has a non-empty string for all five languages", () => {
    for (const [key, entry] of Object.entries(EXTRA_DICT)) {
      for (const lang of LANG_IDS) {
        expect(entry[lang], `${key} · ${lang}`).toBeTypeOf("string");
        expect(entry[lang].trim().length, `${key} · ${lang}`).toBeGreaterThan(0);
      }
    }
  });

  it("is merged into the main DICT so translate() resolves the keys", () => {
    expect(DICT["guide.title"]).toBeDefined();
    expect(DICT["req.subtitle"]).toBeDefined();
    // A real translation differs from English (sanity that langs are populated).
    expect(translate("nl", "guide.eyebrow")).not.toBe(translate("en", "guide.eyebrow"));
    expect(translate("de", "req.savePdf")).not.toBe(translate("en", "req.savePdf"));
  });

  it("placeholders are preserved across languages", () => {
    for (const [key, entry] of Object.entries(EXTRA_DICT)) {
      const enPh = (entry.en.match(/\{[a-z]+\}/gi) || []).sort().join(",");
      for (const lang of LANG_IDS) {
        const ph = (entry[lang].match(/\{[a-z]+\}/gi) || []).sort().join(",");
        expect(ph, `${key} · ${lang}`).toBe(enPh);
      }
    }
  });
});

describe("i18nExtra · requirements coverage", () => {
  const items = SECTIONS.flatMap((s) => s.items);

  it("requirement item ids are unique", () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every requirement item has a translated text (and note where present)", () => {
    for (const item of items) {
      expect(EXTRA_DICT[`req.item.${item.id}.text`], item.id).toBeDefined();
      if (item.note) {
        expect(EXTRA_DICT[`req.item.${item.id}.note`], `${item.id} note`).toBeDefined();
      }
    }
  });

  it("every section has a translated title (and blurb where present)", () => {
    for (const section of SECTIONS) {
      expect(EXTRA_DICT[`req.section.${section.key}.title`], section.key).toBeDefined();
      if (section.blurb) {
        expect(EXTRA_DICT[`req.section.${section.key}.blurb`], `${section.key} blurb`).toBeDefined();
      }
    }
  });

  it("every status and origin has a translation key", () => {
    for (const status of Object.keys(STATUS_META)) {
      expect(EXTRA_DICT[`req.status.${status}`], status).toBeDefined();
    }
    for (const origin of ["Client-stated", "Recommended", "Derived"]) {
      expect(EXTRA_DICT[`req.origin.${origin}`], origin).toBeDefined();
    }
  });
});
