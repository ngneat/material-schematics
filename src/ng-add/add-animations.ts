import { Tree, SchematicContext } from "@angular-devkit/schematics";
import {
  getProjectFromWorkspace,
  getAppModulePath,
  getProjectMainFile,
  hasNgModuleImport,
  addModuleImportToRootModule,
} from "@angular/cdk/schematics";
import { getWorkspace } from "@schematics/angular/utility/workspace";
import { NgAddSchema } from "./schema";

/** Name of the Angular module that enables Angular browser animations. */
const browserAnimationsModuleName = "BrowserAnimationsModule";

/** Name of the module that switches Angular animations to a noop implementation. */
const noopAnimationsModuleName = "NoopAnimationsModule";

export function addAnimationsModule(options: NgAddSchema) {
  return async (host: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, options.project);
    const appModulePath = getAppModulePath(host, getProjectMainFile(project));

    if (options.animations) {
      // In case the project explicitly uses the NoopAnimationsModule, we should print a warning
      // message that makes the user aware of the fact that we won't automatically set up
      // animations. If we would add the BrowserAnimationsModule while the NoopAnimationsModule
      // is already configured, we would cause unexpected behavior and runtime exceptions.
      if (hasNgModuleImport(host, appModulePath, noopAnimationsModuleName)) {
        context.logger.error(
          `Could not set up "${browserAnimationsModuleName}" ` +
            `because "${noopAnimationsModuleName}" is already imported.`
        );
        context.logger.info(`Please manually set up browser animations.`);
        return;
      }

      addModuleImportToRootModule(
        host,
        browserAnimationsModuleName,
        "@angular/platform-browser/animations",
        project
      );
    } else if (
      !hasNgModuleImport(host, appModulePath, browserAnimationsModuleName)
    ) {
      // Do not add the NoopAnimationsModule module if the project already explicitly uses
      // the BrowserAnimationsModule.
      addModuleImportToRootModule(
        host,
        noopAnimationsModuleName,
        "@angular/platform-browser/animations",
        project
      );
    }
  };
}
