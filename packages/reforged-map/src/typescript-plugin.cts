// reforged-map/typescript-plugin: the TypeScript language service plugin
// tsserver loads by name from a Map project's tsconfig (#595). tsserver
// resolves the name without `exports`, through typescript-plugin/package.json,
// and `require`s this file, so it is CommonJS and exports the factory itself.
// The plugin's code is the package's ES modules, loaded here by `require`,
// which Node does from 20.19 and 22.12 on.

import type * as ts from "typescript";
import type * as plugin from "./tsserver/plugin.js";

/** The prefix of every line the plugin writes to the tsserver log. */
const LOG_PREFIX = "reforged-map/typescript-plugin:";

let loaded: typeof plugin | Error | undefined;

function loadPlugin(): typeof plugin | Error {
  if (loaded === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- tsserver requires this CommonJS file, which loads the package's ES modules the same way
      loaded = require("./tsserver/plugin.js") as typeof plugin;
    } catch (error) {
      loaded = error instanceof Error ? error : new Error(String(error));
    }
  }
  return loaded;
}

let loadFailureLogged = false;

/**
 * The plugin's factory, which tsserver calls once with its own `typescript`.
 *
 * @param modules - What tsserver hands a plugin: its `typescript` module.
 * @returns The plugin, which decorates each project's language service.
 */
function init(modules: {
  typescript: Parameters<typeof plugin.create>[0];
}): ts.server.PluginModule {
  return {
    create(info) {
      const module = loadPlugin();
      if (module instanceof Error) {
        if (!loadFailureLogged) {
          loadFailureLogged = true;
          info.project.projectService.logger.info(
            `${LOG_PREFIX} Rawcode details are off: Node ${process.version} could not load the plugin's ES modules (${module.message}). Run tsserver on Node 20.19 or 22.12 and later.`,
          );
        }
        return info.languageService;
      }
      return module.create(modules.typescript, info);
    },
  };
}

export = init;
