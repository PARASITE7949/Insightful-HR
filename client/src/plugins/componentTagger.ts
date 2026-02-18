import type { Plugin } from "vite";

export function componentTagger(): Plugin {
  return {
    name: "component-tagger-stub",
    enforce: "pre",
  };
}

export default componentTagger;
