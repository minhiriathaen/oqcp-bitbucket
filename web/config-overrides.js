const createEntries = require('react-app-rewire-multiple-entry');

const entries = createEntries([
    {
        entry: 'src/example/index.tsx',
        template: 'public/index.html',
        outPath: '/example.html'
    },
    {
        entry: 'src/edit-workspace-mapping/index.tsx',
        template: 'public/index.html',
        outPath: '/edit-workspace-mapping.html'
    },
    {
        entry: 'src/edit-repository-mapping/index.tsx',
        template: 'public/index.html',
        outPath: '/edit-repository-mapping.html'
    },
    {
        entry: 'src/pull-request-overview-analysis/index.tsx',
        template: 'public/index.html',
        outPath: '/pull-request-overview-analysis.html'
    }
]);

module.exports = function override(config, env) {
    entries.addMultiEntry(config);
    return config;
}