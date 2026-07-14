// llama.rn's app.plugin.js points at its ESM build
// (lib/module/expo-plugin/withLlamaRN.js), which Expo's CommonJS plugin
// loader can't parse ("Unexpected token 'typeof'"). This wraps the
// correctly-transpiled CommonJS build instead.
// See https://github.com/mybigday/llama.rn/issues/243
module.exports =
  require("llama.rn/lib/commonjs/expo-plugin/withLlamaRN").default;
