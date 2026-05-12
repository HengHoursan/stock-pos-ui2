import { useI18n } from "vue-i18n";
import { en } from "@/locales";
import type { Schema } from "@/locales";

export function useAppI18n(moduleName?: string) {
  const i18n = useI18n<{ message: Schema }>();
  const { t } = i18n;

  // Reactive proxy for any namespace (fields, crud, or modules like product)
  const group = (ns: string): any => {
    const labels = {} as any;
    const isModule = (en as any).modules?.[ns];
    const prefix = isModule ? `modules.${ns}` : ns;
    const base = (en as any)[ns] || isModule || {};

    Object.keys(base).forEach((key) => {
      Object.defineProperty(labels, key, {
        get: () => t(`${prefix}.${key}`),
        enumerable: true,
      });
    });

    return labels;
  };

  return {
    ...i18n,
    group,
    labels: moduleName ? group(moduleName) : ({} as any),
    fields: group("fields"),
    crud: group("crud"),
    auth: group("auth"),
    menu: group("menu"),
    layout: group("layout"),
    common: group("common"),
  };
}
