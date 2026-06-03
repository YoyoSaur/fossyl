import builderChainsNewline from "./rules/builder-chains-newline";
import noRepoImportOutsideService from "./rules/no-repo-import-outside-service";
import noDuplicateRoutes from "./rules/no-duplicate-routes";
import pathPrefixConvention from "./rules/path-prefix-convention";
import consistentNaming from "./rules/consistent-naming";
import noMixedPrefixes from "./rules/no-mixed-prefixes";
import noBareThrow from "./rules/no-bare-throw";
import noRouterChain from "./rules/no-router-chain";
import noDbImportOutsideRepo from "./rules/no-db-import-outside-repo";

const plugin = {
  rules: {
    "builder-chains-newline": builderChainsNewline,
    "no-repo-import-outside-service": noRepoImportOutsideService,
    "no-duplicate-routes": noDuplicateRoutes,
    "path-prefix-convention": pathPrefixConvention,
    "consistent-naming": consistentNaming,
    "no-mixed-prefixes": noMixedPrefixes,
    "no-bare-throw": noBareThrow,
    "no-router-chain": noRouterChain,
    "no-db-import-outside-repo": noDbImportOutsideRepo,
  },
  configs: {
    recommended: {
      rules: {
        "fossyl/no-repo-import-outside-service": "error",
        "fossyl/no-duplicate-routes": "error",
        "fossyl/no-bare-throw": "error",
      },
    },
    all: {
      rules: {
        "fossyl/no-repo-import-outside-service": "error",
        "fossyl/no-duplicate-routes": "error",
        "fossyl/path-prefix-convention": "warn",
        "fossyl/consistent-naming": "warn",
        "fossyl/no-mixed-prefixes": "warn",
        "fossyl/no-bare-throw": "error",
        "fossyl/no-router-chain": "error",
        "fossyl/no-db-import-outside-repo": "error",
      },
    },
    "route-quality": {
      rules: {
        "fossyl/no-duplicate-routes": "error",
        "fossyl/path-prefix-convention": "warn",
        "fossyl/consistent-naming": "warn",
        "fossyl/no-mixed-prefixes": "warn",
        "fossyl/no-router-chain": "error",
      },
    },
    "architecture-enforcement": {
      rules: {
        "fossyl/no-repo-import-outside-service": "error",
        "fossyl/no-bare-throw": "error",
        "fossyl/no-db-import-outside-repo": "error",
      },
    },
  },
};

export default plugin;
