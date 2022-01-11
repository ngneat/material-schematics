import {
  Rule,
  Tree,
  SchematicContext,
  noop,
  SchematicsException,
  chain,
} from "@angular-devkit/schematics";
import {
  defaultTargetBuilders,
  getProjectFromWorkspace,
  getProjectStyleFile,
  getProjectTargetOptions,
} from "@angular/cdk/schematics";
import { InsertChange } from "@schematics/angular/utility/change";
import {
  getWorkspace,
  updateWorkspace,
} from "@schematics/angular/utility/workspace";
import { basename, dirname, join, normalize, relative } from "path";
import { prompt } from "inquirer";
import {
  mainStyle,
  createDefaultTheme,
  createNonDefaultTheme,
} from "./create-theme";
import { NgAddSchema, ThemeSchema } from "./schema";
import { logging } from "@angular-devkit/core";
import { COLOR_PALETTES } from "../color-palettes";
import { HUE_LIST } from "../hue-list";
import { ProjectDefinition } from "@angular-devkit/core/src/workspace";
import { addClassInIndexFiles } from "./utils";

/** Default file name of the custom theme that can be generated. */
const defaultStylesFilename = "styles.scss";

export function setUpThemes(options: NgAddSchema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace, options.project);
    const stylesPath = getProjectStyleFile(project, "scss");

    const rules: Rule[] = [];

    let isLazyLoadStylePresent = false;

    for (let index = 0; index < options.themeCount; index++) {
      context.logger.info(`
  Setting up theme: ${index + 1}
  `);
      const { themeName, themePath, isDefault, themeContent, isLazy } =
        await createTheme(options.project, tree, context);

      if (tree.exists(themePath)) {
        context.logger
          .warn(`Cannot create a custom Angular Material theme because
                ${themePath} already exists. Skipping custom theme generation.`);
        rules.push(noop());
      } else {
        tree.create(themePath, themeContent);

        if (isDefault) {
          if (!stylesPath) {
            if (!project.sourceRoot) {
              throw new SchematicsException(
                `Could not find source root for project: "${options.project}". ` +
                  `Please make sure that the "sourceRoot" property is set in the workspace config.`
              );
            }

            // Normalize the path through the devkit utilities because we want to avoid having
            // unnecessary path segments and windows backslash delimiters.
            const mainStylesPath = normalize(
              join(project.sourceRoot, defaultStylesFilename)
            );
            const relativeThemePath = relative(
              basename(dirname(mainStylesPath)),
              themePath
            );

            const partialSCSSPath = relativeThemePath
              .replace(".scss", "")
              .replace("_", "");

            const mainStyleContent = mainStyle(
              partialSCSSPath,
              options.project + "-" + themeName
            );

            if (tree.exists(mainStylesPath)) {
              context.logger
                .warn(`Cannot create a custom Angular Material theme because
      ${mainStylesPath} already exists. Skipping custom theme generation.`);
              rules.push(noop());
            }

            tree.create(mainStylesPath, mainStyleContent);
            rules.push(
              addThemeStyleToTarget(
                options.project,
                "build",
                mainStylesPath,
                context.logger
              )
            );
          } else {
            const relativeThemePath = relative(
              basename(dirname(stylesPath)),
              themePath
            );

            const partialSCSSPath = relativeThemePath
              .replace(".scss", "")
              .replace("_", "");

            const mainStyleContent = mainStyle(
              partialSCSSPath,
              options.project + "-" + themeName
            );
            const insertion = new InsertChange(stylesPath, 0, mainStyleContent);
            const recorder = tree.beginUpdate(stylesPath);

            recorder.insertLeft(insertion.pos, insertion.toAdd);
            tree.commitUpdate(recorder);
            rules.push(noop());
          }
        } else {
          isLazyLoadStylePresent = true;
          const skipDefaultStyleCheck = true;
          rules.push(
            addThemeStyleToTarget(
              options.project,
              "build",
              themePath,
              context.logger,
              skipDefaultStyleCheck,
              isLazy,
              themeName
            )
          );
        }
      }
    }

    if (isLazyLoadStylePresent) {
      rules.push(addClassInIndexFiles(options, true, "mat-app-background"));
    }

    return chain(rules);
  };
}

async function createTheme(
  projectName: string,
  tree: Tree,
  context: SchematicContext
): Promise<
  {
    themeName: string;
    themePath: string;
    themeContent: string;
  } & ThemeSchema
> {
  const workspace = await getWorkspace(tree);
  const project = getProjectFromWorkspace(workspace, projectName);

  return new Promise((resolve, reject) => {
    prompt<ThemeSchema>([
      {
        message: "What theme name would you like to give?",
        type: "input",
        name: "name",
        validate: (input: string) => !!input,
      },
      {
        message: `Is this your default theme? (Keep only 1 default theme for whole application)
            `,
        type: "confirm",
        name: "isDefault",
      },
      {
        message: "Light or dark?",
        type: "list",
        default: "light",
        name: "isDarkOrLight",
        choices: ["light", "dark"],
      },
      ...paletteQuestions("Primary"),
      ...paletteQuestions("Accent"),
      ...paletteQuestions("Warn"),
      {
        message:
          "What class name do you want to use for this theme (you will need to apply this class to <body> tag)?",
        type: "input",
        name: "className",
        when: (answer) => !answer.isDefault,
      },
      {
        message:
          "Would you like to lazy load this theme (Recommended for non-default theme, some extra setup will be needed to load the theme)?",
        type: "confirm",
        name: "isLazy",
        default: true,
        when: (answer) => !answer.isDefault,
      },
    ])
      .then((answers) => {
        if (!project.sourceRoot) {
          throw new SchematicsException(
            `Could not find source root for project: "${projectName}". ` +
              `Please make sure that the "sourceRoot" property is set in the workspace config.`
          );
        }
        let themeContent, themeFileName;

        if (answers.isDefault) {
          themeContent = createDefaultTheme(
            projectName + "-" + answers.name,
            answers
          );
          themeFileName = "_" + answers.name.toLowerCase() + ".scss";
        } else {
          themeContent = createNonDefaultTheme(
            projectName + "-" + answers.name,
            answers
          );
          themeFileName = answers.name.toLowerCase() + ".scss";
        }

        const customThemePath = normalize(
          join(project.sourceRoot, "styles", "themes", themeFileName)
        );

        resolve({
          themeName: answers.name,
          themePath: customThemePath,
          themeContent,
          ...answers,
        });
      })
      .catch((err) => {
        context.logger.error(err);
        reject();
      });
  });
}

function addThemeStyleToTarget(
  projectName: string,
  targetName: "test" | "build",
  assetPath: string,
  logger: logging.LoggerApi,
  skipDefaultStyleCheck = false,
  lazyLoadStyle = false,
  bundleName = ""
): Rule {
  return updateWorkspace((workspace) => {
    const project = getProjectFromWorkspace(workspace, projectName);

    // Do not update the builder options in case the target does not use the default CLI builder.
    if (!validateDefaultTargetBuilder(project, targetName, logger)) {
      return;
    }

    const targetOptions = getProjectTargetOptions(project, targetName);
    const styles = targetOptions.styles as (
      | string
      | { input: string; inject: boolean; bundleName?: string }
    )[];

    if (!styles) {
      targetOptions.styles = [assetPath];
    } else {
      const existingStyles = styles.map((s) =>
        typeof s === "string" ? s : s.input
      );

      if (skipDefaultStyleCheck) {
        styles.push({
          input: assetPath,
          inject: !lazyLoadStyle,
          ...(lazyLoadStyle
            ? { bundleName: bundleName + "-theme" }
            : undefined),
        });
      } else {
        for (const [, stylePath] of existingStyles.entries()) {
          // If the given asset is already specified in the styles, we don't need to do anything.
          if (stylePath === assetPath) {
            return;
          }

          // In case a prebuilt theme is already set up, we can safely replace the theme with the new
          // theme file. If a custom theme is set up, we are not able to safely replace the custom
          // theme because these files can contain custom styles, while prebuilt themes are
          // always packaged and considered replaceable.
          if (stylePath.includes(defaultStylesFilename)) {
            logger.error(
              `Could not add the selected theme to the CLI project ` +
                `configuration because there is already a custom theme file referenced.`
            );
            logger.info(
              `Please manually add the following style file to your configuration:`
            );
            logger.info(`    ${assetPath}`);
            return;
          }
        }

        styles.unshift(assetPath);
      }
    }
  });
}

function paletteQuestions(paletteName: "Primary" | "Accent" | "Warn") {
  const paletteNameLowerCase = paletteName.toLowerCase();
  return [
    {
      message: `Choose ${paletteName} theme:`,
      type: "list",
      name: paletteNameLowerCase,
      choices: COLOR_PALETTES,
    },
    {
      message: `Configure ${paletteName} hues?`,
      type: "confirm",
      name: `configure${paletteName}Hues`,
      default: false,
    },
    {
      message: `${paletteName}: Default HUE`,
      type: "list",
      name: `${paletteNameLowerCase}HUEs.default`,
      choices: HUE_LIST,
      when: (answer: ThemeSchema) => answer[`configure${paletteName}Hues`],
      default: "500",
    },
    {
      message: `${paletteName}: Lighter HUE`,
      type: "list",
      name: `${paletteNameLowerCase}HUEs.lighter`,
      choices: HUE_LIST,
      when: (answer: ThemeSchema) => answer[`configure${paletteName}Hues`],
      default: "100",
    },
    {
      message: `${paletteName}: Darker HUE`,
      type: "list",
      name: `${paletteNameLowerCase}HUEs.darker`,
      choices: HUE_LIST,
      when: (answer: ThemeSchema) => answer[`configure${paletteName}Hues`],
      default: "700",
    },
    {
      message: `${paletteName}: Text HUE`,
      type: "list",
      name: `${paletteNameLowerCase}HUEs.text`,
      choices: HUE_LIST,
      when: (answer: ThemeSchema) => answer[`configure${paletteName}Hues`],
      default: "500",
    },
  ];
}

function validateDefaultTargetBuilder(
  project: ProjectDefinition,
  targetName: "build" | "test",
  logger: logging.LoggerApi
) {
  const defaultBuilder = defaultTargetBuilders[targetName];
  const targetConfig = project.targets && project.targets.get(targetName);
  const isDefaultBuilder =
    targetConfig && targetConfig["builder"] === defaultBuilder;

  // Because the build setup for the Angular CLI can be customized by developers, we can't know
  // where to put the theme file in the workspace configuration if custom builders are being
  // used. In case the builder has been changed for the "build" target, we throw an error and
  // exit because setting up a theme is a primary goal of `ng-add`. Otherwise if just the "test"
  // builder has been changed, we warn because a theme is not mandatory for running tests
  // with Material. See: https://github.com/angular/components/issues/14176
  if (!isDefaultBuilder && targetName === "build") {
    throw new SchematicsException(
      `Your project is not using the default builders for ` +
        `"${targetName}". The Angular Material schematics cannot add a theme to the workspace ` +
        `configuration if the builder has been changed.`
    );
  } else if (!isDefaultBuilder) {
    // for non-build targets we gracefully report the error without actually aborting the
    // setup schematic. This is because a theme is not mandatory for running tests.
    logger.warn(
      `Your project is not using the default builders for "${targetName}". This ` +
        `means that we cannot add the configured theme to the "${targetName}" target.`
    );
  }

  return isDefaultBuilder;
}
