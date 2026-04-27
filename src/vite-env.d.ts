/// <reference types="vite/client" />

declare module 'monaco-editor/esm/vs/editor/editor.api' {
  export * from 'monaco-editor'
}

declare module 'monaco-editor/esm/vs/language/json/monaco.contribution' {
  const contribution: unknown
  export default contribution
}

declare module 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution' {
  const contribution: unknown
  export default contribution
}
