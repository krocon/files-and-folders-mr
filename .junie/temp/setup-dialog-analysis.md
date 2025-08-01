# Setup Dialog Implementation Analysis

## Project Structure Understanding

### Frontend (Angular 20)

- Uses new template syntax (@if, @for, @switch) but NO Signals
- RxJS observables with async pipe for state management
- OnPush change detection strategy
- Services for backend communication and data management

### Backend (NestJS)

- Standard controller/service/module pattern
- Environment-based configuration with dynamic paths
- JSON file storage in assets folder
- Standard REST endpoints (GET, PUT, POST)

### Data Models

- Located in libs/fnf-data/src/models/
- Exported via libs/fnf-data/src/index.ts
- Use TypeScript classes with public readonly properties

## Implementation Plan

### 1. Domain Model (SetupData)

```typescript
export class SetupData {
  constructor(
    public openAboutInNewWindow: boolean = false,
    public openSetupInNewWindow: boolean = false,
    public openServerShellInNewWindow: boolean = true,
    public openManageShortcutsInNewWindow: boolean = true,
    public loadFolderSizeAfterSelection: boolean = false,
    public condensedPresentationStyle: boolean = false
  ) {
  }
}
```

### 2. Backend Structure

- Service: apps/fnf-api/src/app/config/setup/setup.service.ts
- Controller: apps/fnf-api/src/app/config/setup/setup.controller.ts
- Module: apps/fnf-api/src/app/config/setup/setup.module.ts
- Data storage: apps/fnf-api/src/assets/setup/data.json

### 3. Frontend Structure

- Component: apps/fnf/src/app/feature/setup/setup.component.*
- Services:
    - setup-persistent.service.ts (API communication)
    - setup-data.service.ts (Event bus/data management)
- Route: /setup

### 4. Integration Points

- app.service.ts init() method - add setupDataService.init() to observables array
- Environment files - add setupPath configuration
- Route configuration for /setup

## Key Requirements

- Dialog with header/content/footer structure
- Content area scrollable (overflow-y: auto)
- Close icon (header) and Cancel button (footer) - navigate to /files
- Save button (footer) - save and navigate to /files
- Clear Local Storage button (footer) with confirmation dialog
- 6 boolean settings with specific defaults

## Testing Requirements

- Jest tests for services
- Ensure frontend/backend startup works
- All existing tests must pass