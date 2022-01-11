import { Tree, SchematicContext } from "@angular-devkit/schematics";
import {
  getProjectFromWorkspace,
  getProjectStyleFile,
} from "@angular/cdk/schematics";
import { getWorkspace } from "@schematics/angular/utility/workspace";
import { NgAddSchema } from "./schema";

export function addMaterialAppStyles(options: NgAddSchema) {
  return async (host: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(host);
    const project = getProjectFromWorkspace(workspace, options.project);
    const styleFilePath = getProjectStyleFile(project);
    const logger = context.logger;

    if (!styleFilePath) {
      logger.error(`Could not find the default style file for this project.`);
      logger.info(`Consider manually adding the Roboto font to your CSS.`);
      logger.info(
        `More information at https://fonts.google.com/specimen/Roboto`
      );
      return;
    }

    const buffer = host.read(styleFilePath);

    if (!buffer) {
      logger.error(
        `Could not read the default style file within the project ` +
          `(${styleFilePath})`
      );
      logger.info(`Please consider manually setting up the Roboto font.`);
      return;
    }

    const htmlContent = buffer.toString();
    const insertion =
      "\n" +
      `html, body { height: 100%; }\n` +
      `body { margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }\n`;

    if (htmlContent.includes(insertion)) {
      return;
    }

    const recorder = host.beginUpdate(styleFilePath);

    recorder.insertLeft(htmlContent.length, insertion);
    host.commitUpdate(recorder);
  };
}