import { defineConfig } from "astro/config";

const repository = process.env.GITHUB_REPOSITORY || "";
const [owner = "", repo = ""] = repository.split("/");
const isUserSiteRepo =
  owner && repo && repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;
const pagesBase = repo && !isUserSiteRepo ? `/${repo}/` : "/";

export default defineConfig({
  site: process.env.SITE_URL || "https://peiy-meguru.github.io",
  base: process.env.GITHUB_ACTIONS === "true" ? pagesBase : "/",
  output: "static",
  vite: {
    build: {
      cssMinify: "esbuild",
    },
  },
});
