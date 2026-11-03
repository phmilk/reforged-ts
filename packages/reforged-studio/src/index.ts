/**
 * The programmatic entry of `reforged-studio`: `startStudio`, the Studio's
 * local server on a Map project's map folder, with the types of its JSON
 * API (`./server/api-types.ts`); and the reader of the developer's
 * own Warcraft III install, which the Studio and the `reforged-builtins`
 * generator read the game through. It reads the local CASC storage
 * (`./casc/storage.ts`), the SLK tables and profile files of its object
 * data, the game data model of a Game data set (`./game-data.ts`), and
 * resolves an icon's or a model's path (`./paths.ts`). Nothing here writes
 * to disk but the thumbnail cache of model previews (`./thumbnails.ts`).
 */
export {
  BUILD_INFO_FILE,
  buildConfigName,
  openStorage,
  parseBuildInfo,
  readFully,
  type BuildInfo,
  type CascFile,
  type CascStorage,
  type ReadableFile,
} from "./casc/storage.js";
export { CascError } from "./casc/error.js";
export { parseSlk, type SlkTable } from "./slk.js";
export { Profile, type Keep, type Override } from "./profile.js";
export {
  BASE_LAYER,
  EDITOR_STRINGS,
  ENUS_LAYER,
  GAME_DATA_SETS,
  GAME_DATA_VERSIONS,
  layeredPath,
  NO_VERSION,
  VERSION_COLUMN,
  versionOf,
  WORLD_EDIT_SECTION,
  type GameDataVersion,
  type LayeredGameDataSet,
} from "./layers.js";
export {
  KIND_FILES,
  OBJECT_KINDS,
  type KindFiles,
  type ObjectKind,
} from "./kinds.js";
export {
  EDITOR_DATA,
  readGameData,
  type EnumerationValue,
  type FieldValue,
  type GameData,
  type GameDataOptions,
  type GameField,
  type GameKind,
  type GameObject,
} from "./game-data.js";
export {
  createPathResolver,
  FILE_ALIASES,
  type ArtLayer,
  type MissingPath,
  type PathResolver,
  type PathResolverOptions,
  type ResolvedPath,
} from "./paths.js";
export {
  allowedArtLayers,
  ART_LAYERS,
  findWorldEditorPreferences,
  readArtLayer,
  SUPPORTED_MODES,
  USER_FOLDER_ENV,
  WORLD_EDITOR_PREFERENCES,
  type ArtLayerOptions,
  type PreferencesMachine,
} from "./art-layer.js";
export {
  defaultCacheFolder,
  THUMBNAIL_LIMIT,
  ThumbnailCache,
  type CacheMachine,
  type ThumbnailKey,
} from "./thumbnails.js";
export {
  EXECUTABLE_ENV,
  findInstall,
  INSTALL_OPTION,
  InstallNotFoundError,
  isWsl,
  systemMachine,
  wellKnownInstalls,
  type InstallMachine,
} from "./install.js";
export {
  checkInstall,
  type InstallCheck,
  type InstallCheckOptions,
} from "./check-install.js";
export {
  DOODADS_FILE,
  PlacementFileError,
  placementCount,
  placementFile,
  readDoodadPlacements,
  readPlacements,
  readUnitPlacements,
  UNITS_FILE,
  type PlacementCounts,
  type Placements,
} from "./placements.js";
export { startStudio, type Studio, type StudioOptions } from "./studio.js";
export { DEFAULT_PORT } from "./server/listen.js";
export {
  OBJECT_ORIGINS,
  type AdoptAnswer,
  type AdoptedObject,
  type AdoptRequest,
  type ArtLayerAnswer,
  type ArtLayerName,
  type ArtLayerRequest,
  type BulkAnswer,
  type BulkOperation,
  type BulkRequest,
  type DefinitionSource,
  type CreateAnswer,
  type CreateRequest,
  type DeleteAnswer,
  type DeleteRequest,
  type DeletionAnswer,
  type DiffAnswer,
  type Edit,
  type EditsRequest,
  type ErrorAnswer,
  type FieldInput,
  type FieldOption,
  type FieldReference,
  type FieldRow,
  type FileDiff,
  type FreeRawcodeAnswer,
  type IconsAnswer,
  type ListedModel,
  type ListedObject,
  type ModelsAnswer,
  type NotReplayed,
  type ObjectDetail,
  type ObjectOrigin,
  type ObjectsAnswer,
  type OpenInEditorAnswer,
  type PlacementFile,
  type RawcodeAnswer,
  type RawcodeCheckAnswer,
  type RawcodeHolder,
  type Referrer,
  type ReloadAnswer,
  type ReloadOffer,
  type ResetRequest,
  type SaveAnswer,
  type SaveRefusedAnswer,
  type SaveRequest,
  type SearchAnswer,
  type SessionAnswer,
  type SessionCounts,
  type StudioEvents,
  type ThumbnailAnswer,
  type TableAnswer,
  type TableCell,
  type TableColumn,
  type TableRow,
} from "./server/api-types.js";
