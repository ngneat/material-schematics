import { Rule, SchematicContext, Tree } from "@angular-devkit/schematics";
import {
  NodePackageInstallTask,
  RunSchematicTask,
} from "@angular-devkit/schematics/tasks";
import {
  addPackageToPackageJson,
  getPackageVersionFromPackageJson,
} from "./package-config";
import { NgAddSchema } from "./schema";

export default function (options: NgAddSchema): Rule {
  return (host: Tree, _context: SchematicContext) => {
    const ngCoreVersionTag = getPackageVersionFromPackageJson(
      host,
      "@angular/core"
    );
    const angularDependencyVersion = ngCoreVersionTag;

    if (angularDependencyVersion === null) {
      _context.logger.error(`
Could not find @angular/core
      `);
      return;
    }
    addPackageToPackageJson(
      host,
      "@angular/material",
      angularDependencyVersion
    );
    addPackageToPackageJson(host, "@angular/cdk", angularDependencyVersion);
    addPackageToPackageJson(host, "@angular/forms", angularDependencyVersion);
    addPackageToPackageJson(
      host,
      "@angular/animations",
      angularDependencyVersion
    );
    const installTaskId = _context.addTask(new NodePackageInstallTask());
    _context.addTask(new RunSchematicTask("ng-add-setup-project", options), [
      installTaskId,
    ]);
  };
}
