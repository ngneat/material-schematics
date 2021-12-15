import { Rule, Tree } from "@angular-devkit/schematics";

export function themes(): Rule {
  return (tree: Tree) => {
    return tree;
  };
}
