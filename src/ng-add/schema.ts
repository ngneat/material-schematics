export interface ThemeSchema {
  name: string;
  isDarkOrLight: "dark" | "light";
  isDefault: boolean;
  isLazy: boolean;
  primary: string;
  configurePrimaryHues: boolean;
  primaryHUEs?: HUE;
  accent: string;
  configureAccentHues: boolean;
  accentHUEs?: HUE;
  warn: string;
  configureWarnHues: boolean;
  warnHUEs?: HUE;
  className: string;
}

export interface NgAddSchema {
  themeCount: number;
  /** Name of the project. */
  project: string;
  typography: boolean;
  animations: boolean;
}

export type HUE = {
  default: string;
  lighter: string;
  darker: string;
  text: string;
};
