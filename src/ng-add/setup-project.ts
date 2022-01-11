import { chain, Rule, Tree } from "@angular-devkit/schematics";
import { getWorkspace } from "@schematics/angular/utility/workspace";
import { ProjectType } from "@schematics/angular/utility/workspace-models";
import { getProjectFromWorkspace } from "@angular/cdk/schematics";
import { NgAddSchema } from "./schema";
import { addFontsToIndex } from "./material-fonts";
import { addAnimationsModule } from "./add-animations";
import { setUpThemes } from "./setup-theme";
import { addClassInIndexFiles } from "./utils";
import { addMaterialAppStyles } from "./add-material-app-styles";

export default function (options: NgAddSchema): Rule {
  return async (tree: Tree) => {
    const workspace = await getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace, options.project);

    if (project.extensions.projectType === ProjectType.Application) {
      return chain([
        addAnimationsModule(options),
        setUpThemes(options),
        addFontsToIndex(options),
        addMaterialAppStyles(options),
        addClassInIndexFiles(options, options.typography),
      ]);
    }
    return;
  };
}
