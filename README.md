# CS4530 Template Project

This is a template project for CS4530, Software Engineering at Northeastern.

## Vite+Express Full-stack React Application

This project has two parts:

1.  A minimal Express transcript API for a very simple transcript server
2.  A Vite frontend with code that calls that server (this lives in the
    `./frontend` directory)

The way this project runs in "production mode" versus "development mode" is
very different.

### Production Mode

Production mode is simpler: there's one server running, the Express server, on
port 3000, accessible via the url <http://localhost:3000>. When a GET request
doesn't match any existing API endpoints, the Express server looks in
`./frontend/dist` to see if there's a file it can serve from that directory.
Files are put in that directory when `npm run build` calls the `vite build`
command.

The `vite build` step is necessary because we're writing our frontend code in
TypeScript, but browsers can't do type stripping like Node can — we have to do
some transformation on the code we're writing to make it browser-friendly.
(Vite is doing a bunch of other transformations for other reasons as well.)

### Development Mode

Development mode is a little trickier to explain. When developing, we want our
browser to be connecting to Vite's "development web server", not to Express,
because Vite does a lot of nifty stuff to make sure that when we change our
TypeScript code, it **reloads the web page**. That is _very_ handy for
frontend web development.

However, this means your "frontend code" — the HTML and JS that the browser is
supposed to run being served by the Vite development web server — is coming
from a different server than the Express server running in React. The default
convention is that Vite development web server is accessed via
<http://localhost:5173>, and the Express API server is accessible via
<http://localhost:3000>. If you try to have a website that is being served
from a different website than the API service it is using, you're going to
have to gain a nightmarish amount of literacy with
[CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS). (A
different port on `localhost` counts as a different website.) This wasn't a
problem in production mode: your entire website is coming from the Express
server. You really want your website look like it's _all_ coming from a single
server during development too.

The easy way to do this is to have the development server _only_ respond to
API requests, and have the Vite development server forwards all API requests
to the Express server. This is called "proxying", and it means that you can
access a complete Vite server from <http://localhost:5173>. (The Vite
development server needs to know what an API request is: it's configured to
treat every route starting with `/api` as an API endpoint.)

### Express API

The Express server's API has the following endpoints:

| Endpoint             | Method | Description                         |
| -------------------- | ------ | ----------------------------------- |
| `/api/addStudent`    | POST   | Add a new student                   |
| `/api/addGrade`      | POST   | Add a grade for an existing student |
| `/api/getTranscript` | POST   | Look up information for a student   |

## Base configuration

The base project configuration follows a philosophy of "minimalism, mostly."
Project configuration should be minimal and have a bias towards implicit
defaults. Deviations from this principle should be justified and documented
(here or elsewhere).

Notable exceptions to this principle:

- `.gitignore` takes a kitchen-sink approach and should freely accept
  additions. (For example, if a student accidentally checks in a file that
  could have been ignored, it makes sense to add that file here.)
- The ESLint configuration is a maximalist attempt at keeping new TypeScript
  programmers on the rails in a complicated codebase, and also giving them a
  sense of working inside style conventions of a project that may differ from
  their own.

- If we can have all project variants using the _exact_ same `tsconfig.json`
  file or `eslint.config.mjs` file by adding a bit of cruft to the base
  configuration, that's a reasonable trade. Things are going to inevitably get
  copy-pasted, and so the fewer copies of configuration files there are, the
  better.

  This is why the `.vscode/settings.json` applies Prettier to html and css
  files even though that's not relevant to the base project, and why
  `eslint.config.mjs` includes React's Rules of Hooks despite most of the
  project variants not including any React code.

### NPM Scripts

This sets up a set of commands that CS4530 templates should consistently
support:

- `npm run check` runs TypeScript
- `npm run lint` runs ESLint, and `npm run lint:fix` runs eslint with the
  `--fix` option
- `npm run prettier` checks formatting, and `npm run prettier:fix` writes
  formatted files back to disk
- `npm run test` runs Vitest tests and reports coverage
- `npm run dev` starts a development server or watch process
- `npm run build` prepares the project for production-style deployment
- `npm start` runs the project in production style

These are tested by github actions in `.github/workflows/main.yml`.

### ESLint

This base project has an opinionated ESLint configuration that relies on
[typed linting](https://typescript-eslint.io/getting-started/typed-linting).
The ESLint configuration makes some assumptions about project structure:

- Frontend code is code that lives in `./frontend` or `./client`, and uses
  React and JSX. (This code is subject to different linter rules.)
- Test code lives in a `**/tests` directory OR has a `*.spec.ts(x)` or a
  `*.test.ts(x)` filename. Tests can use devDependencies, unlike other code.
- Config files all have `*.config.mjs` filenames (vite, vitest, playwright,
  and eslint all can follow this convention). These can also import
  devDependencies, unlike other code. This means we're not using TypeScript to
  check our config files.
- Most everything should be registered as `error`. Warnings don't fail CI
  checks. Exceptions should have a documented reason. Notable exceptions:
  - `no-console` is `warn` because no-console regularly gets turned off by
    line or file specific rules: we want to discourage excessive `no-console`
    use but it is more like the admonition to not check in commented-out code:
    it's mostly a problem when done excessively and it's easy to check in
    visual inspection
  - `prettier` is `warn` because red squigglies for `prettier` are especially
    distracting and we can check for prettier failures in CI separately
  - We do not override the default setting of `warn` for
    `react-hooks/exhaustive-deps` in the default configuration. This rule
    makes the (horrible) suggestion to remove the dependency array, and people
    breaking their projects by blindly following that suggestion would be a
    bad outcome.

### TypeScript

TypeScript is configured with options that support
[type stripping](https://nodejs.org/api/typescript.html#type-stripping).
Beyond this, on top of regular strict settings, the TypeScript configuration
enables:

- `forceConsistentCasingInFileNames`, to avoid osx/linux compatibility
  heartbreak
- `noFallthroughCasesInSwitch` and `noImplicitReturns`, which are linter-like
  properties that don't seem to be supported by typed linting in ESLint
- `noUncheckedSideEffectImports`, which can short-circuit unexpected failures
  due to `.css` files (or similar) not being checked in

### Prettier

The `.prettierrc` file is intended to use some reasonable defaults. A
`.vscode/settings.json` file is added to encourage Visual Studio Code to treat
Prettier as the default formatter for javascript, typescript, json, css, and
html files even if a students' global configuration uses other defaults.

### LF Line Endings

The `.prettierrc`, `.gitattributes`, and `.vscode/settings.json` files
conspire to generally force projects to use `\n` file endings instead of
Windows-style `\r\n` line endings (LF instead of CRLF).

## Project Tree

This project is part of a tree of template projects:

```
Base configuration:
https://github.com/neu-se/spring-26-base
| |
| |-> Traffic light (activity for code design principles lecture):
|     https://github.com/neu-se/spring-26-traffic-light-activity
|
v add an Express server and API tests
https://github.com/neu-se/spring-26-express
| |
| |-> Clock server (support code for react lectures):
|     https://github.com/neu-se/spring-26-websocket-clock
|
v add a Vite frontend (+ Playwright tests) for a simple client/server setup
https://github.com/neu-se/spring-26-vite
|
v add React to the frontend
https://github.com/neu-se/spring-26-fullstack
| |
| |-> Remove backend for a React frontend-only project
|     https://github.com/neu-se/spring-26-react
|
v use NPM workspaces to facilitate sharing of validators between client/server
https://github.com/neu-se/spring-26-workspaces
```
