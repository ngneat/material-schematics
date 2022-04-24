import { Rule, Tree, SchematicsException } from "@angular-devkit/schematics";
import {
  getProjectFromWorkspace,
  getProjectIndexFiles,
  addBodyClass,
} from "@angular/cdk/schematics";
import { getWorkspace } from "@schematics/angular/utility/workspace";
import { NgAddSchema } from "./schema";

export function addClassInIndexFiles(
  options: NgAddSchema,
  check: boolean,
  className = "mat-typography"
): Rule {
  return async (host: Tree) => {
    const workspace = await getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, options.project);
    const projectIndexFiles = getProjectIndexFiles(project);

    if (!projectIndexFiles.length) {
      throw new SchematicsException(
        "No project index HTML file could be found."
      );
    }

    if (check) {
      projectIndexFiles.forEach((path) => addBodyClass(host, path, className));
    }
  };
}

export function getDefaultPalette(paletteName: MaterialPalette): string {
  switch (paletteName) {
    case "Primary":
      return "mat.$indigo-palette";
    case "Accent":
      return "mat.$pink-palette";
    case "Warn":
      return "mat.$red-palette";
    default:
      return "mat.$indigo-palette";
  }
}

export function getDefaultTheme(isDarkOrLight: MaterialDarkLight): number {
  switch (isDarkOrLight) {
    case "light":
      return 0;
    case "dark":
      return 1;
    default:
      return 0;
  }
}
