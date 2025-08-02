# Files and Folders MR

Become a master of file management with "**Files and Folders**" (FnF). FnF is an orthodox browser based file manager for
Mac OS X, Windows and Linux.

The server component based on Node.js, the client component on AngularJS.

It's a fun project. Documentation will be expanded, and new features will be added.

![screen](https://cloud.githubusercontent.com/assets/11378781/14437724/ed962c40-0022-11e6-963f-523c2225df9b.png)

## Main features of FnF:

* Cross-platform (Frontend: browser, Backend: node.js)
* Orthodox file managers (two-panel directory view with a command line below)
* Tabbed interface
* All operations working in queues
* Multi-rename tool (Batch rename, apply filename changes to a group of files simultaneously)
* Multi-group tool (Arranging and Grouping files, moving files to folders)
* Directory history for changing back to recently viewed directories.
* Configurable extensions menu to start external programs
* User definable colors
* User definable keyboard shortcuts
* File List Filtering: Quickly filter a list of files by name, extension, or kind.
* Smart Sorting: Sort by folders, packages, or files first.
* Work with your files side-by-side in a customizable Dual Pane View and enjoy Full Keyboard Navigation.
* Access frequently used files and folders with Bookmarks and Tab Presets.
* View and manipulate hidden files.
* Application Launcher: Access your apps with the press of a key.
* Copy Names or Path of selected files and folders as text or json to clipboard.
* Open a terminal window with active folder ("New Terminal Here")
* Much more

## For end user

### Step 1: Build

Build a docker container:

```bash
npm run pnpm-i && npm run build:all && npm run docker:build
```

### Step 2a: Start with docker compose

#### Configure

Configure a docker compose:

```md
services:
fnf-instance-1:
image: krocon/files-and-folders-mr
container_name: fnf-1
ports:
- "3333:3333"
- "3334:3334"
volumes:
- /:/
environment:
- FNF_INCOMPATIBLE_PATHS=
- FNF_START_PATH=/fnf
- FNF_DOCKER_ROOT=/fnf
- FNF_OPENAI_API_KEY='sk-youropenaiapikeyhere'
- FNF_OPENAI_API_URL='https://api.openai.com/v1/chat/completions'
- FNF_OPENAI_MODEL='gpt-4'
- FNF_AI_COMPLETION_SERVICE='openai'
- NODE_ENV=production
restart: unless-stopped

fnf-instance-2:
image: krocon/files-and-folders-mr
container_name: fnf-2
ports:
- "3335:3333"
- "3336:3334"
volumes:
- /:/
environment:
- FNF_INCOMPATIBLE_PATHS=
- FNF_START_PATH=/fnf
- FNF_DOCKER_ROOT=/fnf
- FNF_OPENAI_API_KEY='sk-youropenaiapikeyhere'
- FNF_OPENAI_API_URL='https://api.openai.com/v1/chat/completions'
- FNF_OPENAI_MODEL='gpt-4'
- FNF_AI_COMPLETION_SERVICE='openai'
- NODE_ENV=production
restart: unless-stopped
```

#### Start

```bash
docker compose up
```

#### Stop

```bash
docker compose down
```

### Step 2b: Simple docker

```bash
docker run -p 3333:3333 -p 3334:3334 -v /Users:/fnf/Users -v /Volumes:/fnf/Volumes --name fnf --env=FNF_INCOMPATIBLE_PATHS='' --env=FNF_START_PATH='fnf' --env=NODE_ENV=production -d krocon/files-and-folders-mr

```

### Step 2c: Start without docker

Start frontend and backend:

```bash
npm run start:fnf
```

```bash
npm run start:fnf-api
```

## Project Structure

- `apps/fnf`: Angular 20 frontend application
- `apps/fnf-api`: NestJS backend API
- `libs/fnf-data`: Shared library with common models and utilities

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Getting Started

### Install Dependencies

```bash
npm run pnpm-i
```

This will install dependencies for the root project and all packages.

### Build

```bash
npm run build:all
```

This will build the shared library, Angular frontend, and NestJS backend in the correct order.

### Run Applications

#### Start Angular Frontend

```bash
npm run start:fnf
```

The Angular application will be available at http://localhost:4200.

#### Start NestJS Backend

```bash
npm run start:fnf-api
```

The NestJS API will be available at http://localhost:3000.

### Testing

```bash
npm run test
```

This will run tests for all packages.

## Development

### Shared Library

The shared library contains common models and utilities that can be used by both the frontend and backend applications.

To build the shared library:

```bash
pnpm build:fnf-domain
```

### Angular Frontend

The Angular frontend is located in `apps/fnf`. It's built with Angular 19 and uses the shared library.

To build the Angular frontend:

```bash
pnpm build:fnf
```

### NestJS Backend

The NestJS backend is located in `apps/fnf-api`. It's built with the latest version of NestJS and uses the shared library.

To build the NestJS backend:

```bash
pnpm build:fnf-api
```






