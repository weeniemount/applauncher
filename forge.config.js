const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  packagerConfig: {
    asar: true,
    icon: 'src/icons/windows',
  },
  prune: true,
  ignore: [
    /locales/,       // Ignore the locales folder
    /.*\.map$/,      // Optionally ignore map files
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: 'src/icons/windows.ico', // Icon for the installer
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.DisableDevTools]: true,
      [FuseV1Options.EnableRemoteModule]: false,
      [FuseV1Options.EnableChromiumRemoteDebugging]: false, // Disable remote debugging
    }),
  ],
};
