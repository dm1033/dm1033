# Claude Code Marketplace Aggregator

Build hierarchical Claude Code marketplaces through distributed composition. Each marketplace declares its immediate children; recursive application creates arbitrarily deep marketplace hierarchies.

## Vision

Claude Code marketplaces reference individual plugins, not other marketplaces. This tool solves that through **distributed composition**:

```
My Enterprise Marketplace
├── Engineering Department Marketplace
│   ├── Platform Team Marketplace
│   │   ├── Pipeline Plugin
│   │   └── Build Plugin
│   └── API Helper Plugin
└── Operations Marketplace
    └── Monitoring Plugin
```

**How:** Each marketplace maintains `.sync-config.json` declaring its children. The script aggregates plugins from child marketplaces, with denylist filtering and origin tracking. Each level runs the tool; recursion creates the hierarchy.

## Usage

### 1. Create `.sync-config.json`
```json
{
  "marketplace": {"name": "my-marketplace", "version": "1.0.0"},
  "sources": [
    {
      "type": "marketplace",
      "url": "https://github.com/child-org/marketplace",
      "tag_prefix": "child-org",
      "denylist": ["unwanted-plugin"]
    },
    {
      "type": "skill",
      "name": "my-skill",
      "url": "https://github.com/org/skill-repo",
      "target_path": "skills/my-skill"
    }
  ]
}
```

### 2. Use GitHub Action or GitLab Pipeline

**GitHub Actions:**
```yaml
- uses: ralphbean/claude-marketplace-sync@main
  with:
    config-path: '.sync-config.json'
```
See [github/workflows/sync-marketplaces.yml](github/workflows/sync-marketplaces.yml) for complete workflow.

**GitLab CI/CD:**
```yaml
include:
  - remote: 'https://raw.githubusercontent.com/ralphbean/claude-marketplace-sync/main/gitlab/gitlab-ci.yml'

sync-marketplaces:
  extends: .sync-marketplaces-template
  tags: [your-runners]
  only: [main]
```
See [gitlab/gitlab-ci.yml](gitlab/gitlab-ci.yml) for full template.

### 3. Voilà!

Outputs:
- `.claude-plugin/marketplace.json` - aggregated marketplace
- `.claude-plugin/origins.json` - plugin provenance tracking

## Examples

Configuration patterns and use cases:
- **[examples/sync-config-simple.json](examples/sync-config-simple.json)** - Two-level hierarchy
- **[examples/sync-config-enterprise.json](examples/sync-config-enterprise.json)** - Multi-department enterprise
- **[examples/sync-config-with-denylist.json](examples/sync-config-with-denylist.json)** - Curated with denylisting
- **[examples/sync-config-mixed-sources.json](examples/sync-config-mixed-sources.json)** - Personal marketplace mixing sources

## License

MIT
