import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/YoyoSaur/fossyl/tree/main/packages/eslint-plugin/docs/rules/${name}.md`,
);
