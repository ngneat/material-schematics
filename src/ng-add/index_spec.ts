import { HostTree } from "@angular-devkit/schematics";
import {
  SchematicTestRunner,
  UnitTestTree,
} from "@angular-devkit/schematics/testing";
import * as path from "path";

const collectionPath = path.join(__dirname, "../collection.json");

describe("ng-add", () => {
  let appTree: UnitTestTree;
  let schematicRunner: SchematicTestRunner;
  beforeEach(async () => {
    schematicRunner = new SchematicTestRunner(
      "ngx-material-schematics",
      require.resolve(collectionPath)
    );
    appTree = new UnitTestTree(new HostTree());
    appTree.create("/package.json", JSON.stringify({}));
  });

  it("works", async () => {
    const tree: UnitTestTree = await schematicRunner
      .runSchematicAsync("ng-add", undefined, appTree)
      .toPromise();

    const packageJSONContent = JSON.parse(tree.readContent("/package.json"));

    expect(
      packageJSONContent.devDependencies["ngx-material-schematics"]
    ).toBeTruthy();
  });
});
