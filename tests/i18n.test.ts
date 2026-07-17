import { describe, it, expect } from "vitest";
import { translate } from "@/lib/i18n";

describe("i18n · translate", () => {
  it("returns the key itself for unknown keys", () => {
    expect(translate("en", "does.not.exist")).toBe("does.not.exist");
  });

  it("translates a known key per language", () => {
    expect(translate("en", "common.save")).toBe("Save");
    expect(translate("nl", "common.save")).toBe("Opslaan");
    expect(translate("de", "common.cancel")).toBe("Abbrechen");
    expect(translate("fr", "common.remove")).toBe("Supprimer");
    expect(translate("es", "common.edit")).toBe("Editar");
  });

  it("interpolates {params}", () => {
    expect(translate("en", "house.inUse", { n: 4, total: 14 })).toBe("4/14 units in use");
    expect(translate("en", "ops.needAttention", { n: 3 })).toBe("3 items need attention");
  });
});
