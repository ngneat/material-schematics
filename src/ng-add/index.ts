import { Rule, SchematicContext, Tree } from "@angular-devkit/schematics";
import { NodePackageInstallTask } from "@angular-devkit/schematics/tasks";
import { sortObjectByKeys } from "../utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON = require("../../package.json");

export function ngAdd(): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    if (!tree.exists("package.json")) {
      throw new Error(
        "Could not find a `package.json` file at the root of your workspace"
      );
    }

    const projectPackageJSON = (tree.read("package.json") as Buffer).toString(
      "utf-8"
    );
    const json = JSON.parse(projectPackageJSON);
    json.devDependencies = json.devDependencies || {};

    json.devDependencies[packageJSON.name] = packageJSON.version;

    json.devDependencies = sortObjectByKeys(json.devDependencies);
    tree.overwrite("package.json", JSON.stringify(json, null, 2));

    _context.addTask(new NodePackageInstallTask());

    _context.logger.info(`
All ngx-material-schematics have been successfully installed 🎉
Please see https://github.com/shhdharmen/ngx-material-schematics for more.
`);

    return tree;
  };
}
