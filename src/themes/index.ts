import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from "@angular-devkit/schematics";
import { prompt } from "inquirer";
import { ThemeSchema } from "./schema";

export function themes(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // 1. Check if Angular Material is installed.

    // 2. Ask for theme details and create one
    const createThemeRule = rulify(createTheme(tree, context));

    return chain([createThemeRule]);
  };
}

function rulify(obj: Tree | Promise<Tree> | Rule | null): Rule {
  const rule = (tree: Tree, context: SchematicContext) => {
    return typeof obj === "function" ? obj(tree, context) : obj;
  };
  return rule as Rule;
}

function createTheme(tree: Tree, context: SchematicContext): Promise<Tree> {
  return new Promise((resolve, reject) => {
    prompt<ThemeSchema>([
      {
        message: "What theme name would you like to give?",
        type: "input",
        default: "Light",
        name: "name",
      },
      {
        message:
          "Is this your default theme (Keep only 1 default theme for whole application)?",
        type: "confirm",
        default: false,
        name: "isDefault",
      },
      {
        message:
          "Do you want to lazy load this theme (Recommended for non-default themes)?",
        type: "confirm",
        default: true,
        name: "isLazy",
        when: (answer) => !answer.isDefault,
      },
    ])
      .then((answers) => {
        const themeName =
          (answers.isDefault ? "" : "_") + answers.name.toLowerCase() + ".scss";

        tree.create("src/styles/themes/" + themeName, "");

        resolve(tree);
      })
      .catch((err) => {
        context.logger.error(err);
        reject(tree);
      });
  });
}
