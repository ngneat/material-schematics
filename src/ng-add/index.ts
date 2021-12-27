import { Rule, SchematicContext, Tree } from "@angular-devkit/schematics";
import {
  // NodePackageInstallTask,
  RunSchematicTask,
} from "@angular-devkit/schematics/tasks";

export function ngAdd(): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    // const taskId = _context.addTask(new NodePackageInstallTask());

    _context.addTask(new RunSchematicTask("themes", {}));

    return _tree;
  };
}
