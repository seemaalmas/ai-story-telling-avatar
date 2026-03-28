# @katha/config

Shared environment configuration for the Katha platform.

## Environments

- `local` - Local development
- `development` - Shared dev server
- `staging` - Pre-production
- `production` - Live

## Usage

```typescript
import { getEnvironmentConfig } from '@katha/config';

const config = getEnvironmentConfig('staging');
console.log(config.apiUrl); // https://staging-api.katha.ai
```
