import noRepoImportOutsideService from './rules/no-repo-import-outside-service';
import noDuplicateRoutes from './rules/no-duplicate-routes';
import pathPrefixConvention from './rules/path-prefix-convention';
import consistentNaming from './rules/consistent-naming';
import noMixedPrefixes from './rules/no-mixed-prefixes';

const plugin = {
  rules: {
    'no-repo-import-outside-service': noRepoImportOutsideService,
    'no-duplicate-routes': noDuplicateRoutes,
    'path-prefix-convention': pathPrefixConvention,
    'consistent-naming': consistentNaming,
    'no-mixed-prefixes': noMixedPrefixes,
  },
  configs: {
    recommended: {
      rules: {
        'fossyl/no-repo-import-outside-service': 'error',
        'fossyl/no-duplicate-routes': 'error',
      },
    },
    all: {
      rules: {
        'fossyl/no-repo-import-outside-service': 'error',
        'fossyl/no-duplicate-routes': 'error',
        'fossyl/path-prefix-convention': 'warn',
        'fossyl/consistent-naming': 'warn',
        'fossyl/no-mixed-prefixes': 'warn',
      },
    },
    'route-quality': {
      rules: {
        'fossyl/no-duplicate-routes': 'error',
        'fossyl/path-prefix-convention': 'warn',
        'fossyl/consistent-naming': 'warn',
        'fossyl/no-mixed-prefixes': 'warn',
      },
    },
    'architecture-enforcement': {
      rules: {
        'fossyl/no-repo-import-outside-service': 'error',
      },
    },
  },
};

export default plugin;
