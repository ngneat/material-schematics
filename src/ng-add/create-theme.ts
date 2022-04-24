import { HUE, ThemeSchema } from "./schema";

export function createCustomDefaultTheme(name: string, options: ThemeSchema) {
  return `
@use "sass:map";
@use '@angular/material' as mat;

@include mat.core();

$${name}-primary: mat.define-palette(${options.primary}${
    options.primaryHUEs ? getHUEs(options.primaryHUEs) : ""
  });
$${name}-accent: mat.define-palette(${options.accent}${
    options.accentHUEs ? getHUEs(options.accentHUEs) : ""
  });

// The warn palette is optional (defaults to red).
$${name}-warn: mat.define-palette(${options.warn}${
    options.warnHUEs ? getHUEs(options.warnHUEs) : ""
  });

// Create the theme object. A theme consists of configurations for individual
// theming systems such as "color" or "typography".
$${name}-theme: mat.define-${options.isDarkOrLight}-theme((
  color: (
    primary: $${name}-primary,
    accent: $${name}-accent,
    warn: $${name}-warn,
  )
));

`;
}

export function createCustomNonDefaultTheme(
  name: string,
  options: ThemeSchema
) {
  return `

@use "sass:map";
@use '@angular/material' as mat;
  
@include mat.core();
  
$${name}-primary: mat.define-palette(${options.primary}${
    options.primaryHUEs ? getHUEs(options.primaryHUEs) : ""
  });
$${name}-accent: mat.define-palette(${options.accent}${
    options.accentHUEs ? getHUEs(options.accentHUEs) : ""
  });

// The warn palette is optional (defaults to red).
$${name}-warn: mat.define-palette(${options.warn}${
    options.warnHUEs ? getHUEs(options.warnHUEs) : ""
  });

// Create the theme object. A theme consists of configurations for individual
// theming systems such as "color" or "typography".
$${name}-theme: mat.define-${options.isDarkOrLight}-theme((
  color: (
    primary: $${name}-primary,
    accent: $${name}-accent,
    warn: $${name}-warn,
  )
));

.${options.className} {
  // Include theme styles for core and each component used in your app.
  // Alternatively, you can import and @include the theme mixins for each component
  // that you are using.
  @include mat.all-component-colors($${name}-theme);
}

`;
}

export function createDefaultTheme(themeName: MaterialTheme) {
  return `
@import "@angular/material/prebuilt-themes/${themeName}.css";

`;
}

export function createNonDefaultTheme(themeName: string, options: ThemeSchema) {
  return `

.${options.className} {
  // Include theme styles for core and each component used in your app.
  // Alternatively, you can import and @include the theme mixins for each component
  // that you are using.
  @import "@angular/material/prebuilt-themes/${themeName}.css";
}

`;
}

export function mainCustomStyle(themePath: string, themeName: string) {
  const pathSegments = themePath.split("/");
  const sassModuleName = pathSegments[pathSegments.length - 1];
  return `
@use "@angular/material" as mat;

@use "${themePath}";
  
@include mat.core();
  
// Include theme styles for core and each component used in your app.
// Alternatively, you can import and @include the theme mixins for each component
// that you are using.
@include mat.all-component-themes(${sassModuleName}.$${themeName}-theme);

`;
}

export function mainStyle(themePath: string) {
  return `
@use "${themePath}";

`;
}

function getHUEs(hues: HUE): string {
  return `, ${hues.default}, ${hues.lighter}, ${hues.darker}, ${hues.text}`;
}
