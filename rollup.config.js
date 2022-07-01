import typescript from "@rollup/plugin-typescript"; // 解析ts
import sourceMaps from "rollup-plugin-sourcemaps"; // 映射源文件
import resolve from "@rollup/plugin-node-resolve"; // 简化导入文件长度 ./foo/index.js  ./foo
import commonjs from "@rollup/plugin-commonjs" //CommonJS 转换插件
import replace from "@rollup/plugin-replace"; // 字符串替换

export default {
  input:"./packages/vue/src/index.ts",
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("development"),
      "process.env.VUE_ENV": JSON.stringify("browser"),
      "process.env.LANGUAGE": JSON.stringify(process.env.LANGUAGE),
    }),
    resolve(),
    commonjs(),
    typescript(),
    sourceMaps(),
  ],
  output: [
    {
      format: "cjs",
      file: "./packages/vue/dist/mini-vue.cjs.js",
      sourcemap: true,
    },
    {
      name: "vue",
      format: "es",
      file: "./packages/vue/dist/mini-vue.esm-bundler.js",
      sourcemap: true,
    },
  ],
  onwarn: (msg, warn) => {
    // 忽略 Circular 的错误
    if (!/Circular/.test(msg)) {
      warn(msg);
    }
  },
};
