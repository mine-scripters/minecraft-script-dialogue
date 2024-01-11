import gulp from 'gulp';
import debug from 'gulp-debug';
import { deleteAsync, deleteSync } from 'del';
import * as os from 'os';
import vinylPaths from 'vinyl-paths';
import { spawn } from 'child_process';
import { rollup } from 'rollup';
import terser from '@rollup/plugin-terser';
import rollupTs from 'rollup-plugin-ts';
import fs from 'fs';
import path from "path";

// === CONFIGURABLE VARIABLES
const bpfoldername = 'MinecraftDialogueScriptDemo';
const rpfoldername = undefined;
const useMinecraftPreview = false; // Whether to target the "Minecraft Preview" version of Minecraft vs. the main store version of Minecraft
const useMinecraftDedicatedServer = false; // Whether to use Bedrock Dedicated Server - see https://www.minecraft.net/download/server/bedrock
const dedicatedServerPath = 'C:/mc/bds/1.19.0/'; // if using Bedrock Dedicated Server, where to find the extracted contents of the zip package
const configInputScript = undefined; // Input script (the ts file) - if not set, it tries to find out from the behavior pack
const configOutputScript = undefined; // Output script (the js file in the behavior pack) - if not set, it tries to find out from the behavior pack
// === END CONFIGURABLE VARIABLES

// constants, no need to update
const constants = {
  environments: {
    mcpelauncher: '/.local/share/mcpelauncher/games/com.mojang/',
    mcpelauncher_mac: '/Library/Application Support/mcpelauncher/games/com.mojang/',
    windows: {
      preview: '/AppData/Local/Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/',
      stable: '/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/',
    },
  },
};

const getMinecraftDir = () => {
  const basePath = useMinecraftDedicatedServer ? dedicatedServerPath : os.homedir();

  if (os.platform() === 'win32') {
    return (
      basePath + (useMinecraftPreview ? constants.environments.windows.preview : constants.environments.windows.stable)
    );
  } else if (os.platform() === 'darwin') {
    return basePath + constants.environments.mcpelauncher_mac;
  }

  return basePath + constants.environments.mcpelauncher;
};

const getJavascriptEntryPath = () => {
  const manifestPath = `./behavior_packs/${bpfoldername}/manifest.json`;
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  const module = manifest.modules.find((m) => m.language === 'javascript');
  if (!module) {
    throw new Error(`Unable to find the javascript module in the manifest: ${manifestPath}`);
  }

  return module.entry;
};

const getInputScript = () => {
  const entry = getJavascriptEntryPath();
  return entry.substring(0, entry.lastIndexOf('.js')) + '.ts';
};

const getOutputScript = getJavascriptEntryPath;

const inputScript = configInputScript ? configInputScript : getInputScript();
const outputScript = configOutputScript ? configOutputScript : getOutputScript();

const deleteAsyncForce = (patterns) => {
  return deleteSync(patterns, { force: true });
};

const worldsFolderName = useMinecraftDedicatedServer ? 'worlds' : 'minecraftWorlds';
const activeWorldFolderName = useMinecraftDedicatedServer ? 'Bedrock level' : bpfoldername + 'world';
const mcdir = getMinecraftDir();

function clean_build() {
  return gulp
    .src(['build/behavior_packs/', 'build/resource_packs/'], { read: false, allowEmpty: true })
    .pipe(vinylPaths(deleteAsync));
}

function copy_behavior_packs() {
  return gulp.src(['behavior_packs/**/*']).pipe(gulp.dest('build/behavior_packs'));
}

function copy_resource_packs() {
  return gulp.src(['resource_packs/**/*']).pipe(gulp.dest('build/resource_packs'));
}

const copy_content = gulp.parallel(copy_behavior_packs, copy_resource_packs);

async function compile_scripts() {
  console.log('compile_scripts 0');
  const bundle = await rollup({
    input: inputScript,
    external: ['@minecraft/server', '@minecraft/server-ui'],
    plugins: [
      rollupTs({
        tsconfig: (resolvedOptions) => ({
          ...resolvedOptions,
          compilerOptions: {
            ...resolvedOptions.compilerOptions,
            declaration: false,
          },
        }),
      }),
      terser(),
    ],
  });

  console.log('compile_scripts 1');
  await bundle.write({
    file: 'build/behavior_packs/' + bpfoldername + `/${outputScript}`,
    format: 'es',
    sourcemap: true,
    sourcemapFile: 'scripts/script_dialogue',
  });

  console.log('checking files', fs.readdirSync('build/behavior_packs/' + bpfoldername + '/scripts/script_dialogue'));

  const mapFile = 'build/behavior_packs/_' + bpfoldername + `Debug/${outputScript}.map`;

  fs.mkdirSync(
    path.dirname(mapFile),
    {
      recursive: true
    }
  );

  fs.renameSync(
    'build/behavior_packs/' + bpfoldername + `/${outputScript}.map`,
    'build/behavior_packs/_' + bpfoldername + `Debug/${outputScript}.map`
  );

  console.log('compile_scripts 2');
  // await gulp
  //   .src('build/behavior_packs/' + bpfoldername + '/scripts/**/*.js.map')
  //   .pipe(gulp.dest('build/behavior_packs/_' + bpfoldername + 'Debug/scripts'));

  console.log('compile_scripts 3');
  // await gulp
  //   .src(['build/behavior_packs/' + bpfoldername + '/scripts/**/*.js.map'], { read: false })
  //   .pipe(vinylPaths(deleteAsyncForce))
  //   .pipe(debug());

  // await deleteAsync(['build/behavior_packs/' + bpfoldername + '/scripts/**/*.js.map'], {
  //   force: true
  // });

  console.log('compile_scripts 4');
  console.log('checking files', fs.readdirSync('build/behavior_packs/' + bpfoldername + '/scripts/script_dialogue'));
  return Promise.resolve();

  // callback();
}

const build = gulp.series(clean_build, copy_content, compile_scripts);

function clean_localmc() {
  const toDelete = [];

  if (!bpfoldername || !bpfoldername.length || bpfoldername.length < 2) {
    console.log('No bpfoldername specified.');
  } else {
    toDelete.push(mcdir + 'development_behavior_packs/' + bpfoldername);
  }

  if (!rpfoldername) {
    console.log('No rpfoldername specified.');
  } else {
    toDelete.push(mcdir + 'development_resource_packs/' + rpfoldername);
  }

  return gulp.src(toDelete, { read: false, allowEmpty: true }).pipe(vinylPaths(deleteAsyncForce));
}

function deploy_localmc_behavior_packs() {
  console.log("Deploying to '" + mcdir + 'development_behavior_packs/' + bpfoldername + "'");
  console.log(fs.readdirSync('build/behavior_packs/' + bpfoldername + '/scripts/script_dialogue'));
  return gulp
    .src(['build/behavior_packs/' + bpfoldername + '/**/*'])
    .pipe(debug())
    .pipe(gulp.dest(mcdir + 'development_behavior_packs/' + bpfoldername));
}

function deploy_localmc_resource_packs() {
  if (rpfoldername) {
    console.log("Deploying to '" + mcdir + 'development_resource_packs/' + rpfoldername + "'");
    return gulp
      .src(['build/resource_packs/' + rpfoldername + '/**/*'])
      .pipe(gulp.dest(mcdir + 'development_resource_packs/' + rpfoldername));
  } else {
    return Promise.resolve();
  }
}

function getTargetWorldPath() {
  return mcdir + worldsFolderName + '/' + activeWorldFolderName;
}

function getTargetConfigPath() {
  return mcdir + 'config';
}

function getTargetWorldBackupPath() {
  return 'backups/worlds/' + activeWorldFolderName;
}

function getDevConfigPath() {
  return 'config';
}

function getDevWorldPath() {
  return 'worlds/default';
}

function getDevWorldBackupPath() {
  return 'backups/worlds/devdefault';
}

function clean_localmc_world() {
  console.log("Removing '" + getTargetWorldPath() + "'");
  return gulp.src([getTargetWorldPath()], { read: false }).pipe(vinylPaths(deleteAsyncForce));
}

function clean_localmc_config() {
  console.log("Removing '" + getTargetConfigPath() + "'");
  return gulp.src([getTargetConfigPath()], { read: false }).pipe(vinylPaths(deleteAsyncForce));
}

function clean_dev_world() {
  console.log("Removing '" + getDevWorldPath() + "'");

  return gulp.src([getDevWorldPath()], { read: false }).pipe(vinylPaths(deleteAsyncForce));
}

function clean_localmc_world_backup() {
  console.log("Removing backup'" + getTargetWorldBackupPath() + "'");

  return gulp.src([getTargetWorldBackupPath()], { read: false }).pipe(vinylPaths(deleteAsyncForce));
}

function clean_dev_world_backup() {
  console.log("Removing backup'" + getDevWorldBackupPath() + "'");

  return gulp.src([getDevWorldBackupPath()], { read: false }).pipe(vinylPaths(deleteAsyncForce));
}

function backup_dev_world() {
  console.log("Copying world '" + getDevWorldPath() + "' to '" + getDevWorldBackupPath() + "'");
  return gulp
    .src([getTargetWorldPath() + '/**/*'])
    .pipe(gulp.dest(getDevWorldBackupPath() + '/worlds/' + activeWorldFolderName));
}

function deploy_localmc_config() {
  console.log("Copying world 'config/' to '" + getTargetConfigPath() + "'");
  return gulp.src([getDevConfigPath() + '/**/*']).pipe(gulp.dest(getTargetConfigPath()));
}

function deploy_localmc_world() {
  console.log("Copying world 'worlds/default/' to '" + getTargetWorldPath() + "'");
  return gulp.src([getDevWorldPath() + '/**/*']).pipe(gulp.dest(getTargetWorldPath()));
}

function ingest_localmc_world() {
  console.log("Ingesting world '" + getTargetWorldPath() + "' to '" + getDevWorldPath() + "'");
  return gulp.src([getTargetWorldPath() + '/**/*']).pipe(gulp.dest(getDevWorldPath()));
}

function backup_localmc_world() {
  console.log("Copying world '" + getTargetWorldPath() + "' to '" + getTargetWorldBackupPath() + "/'");
  return gulp
    .src([getTargetWorldPath() + '/**/*'])
    .pipe(gulp.dest(getTargetWorldBackupPath() + '/' + activeWorldFolderName));
}

const deploy_localmc = gulp.series(
  clean_localmc,
  function (callbackFunction) {
    if (!useMinecraftDedicatedServer) {
      // Todo: Add beep
    }
    callbackFunction();
  },
  gulp.parallel(deploy_localmc_behavior_packs, deploy_localmc_resource_packs)
);

function watchTask() {
  return gulp.watch(
    ['scripts/**/*.ts', 'behavior_packs/**/*', 'resource_packs/**/*'],
    gulp.series(build, deploy_localmc)
  );
}

function serveTask() {
  return gulp.watch(
    ['scripts/**/*.ts', 'behavior_packs/**/*', 'resource_packs/**/*'],
    gulp.series(stopServer, build, deploy_localmc, startServer)
  );
}

let activeServer = null;

function stopServer() {
  if (activeServer) {
    activeServer.stdin.write('stop\n');
    activeServer = null;
  }

  return Promise.resolve();
}

function startServer() {
  if (activeServer) {
    activeServer.stdin.write('stop\n');
    activeServer = null;
  }

  activeServer = spawn(dedicatedServerPath + 'bedrock_server');

  let logBuffer = '';

  let serverLogger = function (buffer) {
    let incomingBuffer = buffer.toString();

    if (incomingBuffer.endsWith('\n')) {
      (logBuffer + incomingBuffer).split(/\n/).forEach(function (message) {
        if (message) {
          if (activeServer !== null && message.indexOf('Server started.') >= 0) {
            activeServer.stdin.write('script debugger listen 19144\n');
            // Todo: Add beep
          }
          console.log('Server: ' + message);
        }
      });
      logBuffer = '';
    } else {
      logBuffer += incomingBuffer;
    }
  };

  activeServer.stdout.on('data', serverLogger);
  activeServer.stderr.on('data', serverLogger);

  return Promise.resolve();
}

export default gulp.series(build, deploy_localmc);
export const clean = gulp.series(clean_build, clean_localmc);
export const watch = gulp.series(build, deploy_localmc, watchTask);
export const serve = gulp.series(build, deploy_localmc, startServer, serveTask);

export const updateworld = gulp.series(
  clean_localmc_world_backup,
  backup_localmc_world,
  clean_localmc_world,
  deploy_localmc_world
);
export const ingestworld = gulp.series(clean_dev_world_backup, backup_dev_world, clean_dev_world, ingest_localmc_world);
export const updateconfig = gulp.series(clean_localmc_config, deploy_localmc_config);

export {
  clean_build,
  copy_behavior_packs,
  copy_resource_packs,
  compile_scripts,
  copy_content,
  build,
  clean_localmc,
  deploy_localmc,
};
