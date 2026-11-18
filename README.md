# Emerald Ocean for VS Code

A dark theme coloured like the ocean when green beats blue: a green-black base taken from a breaking emerald wave, emerald keywords and functions, lagoon types, sea-blue packages and fields, foam-white values, glow-blue strings with foam-white quotes and emerald escapes, and bioluminescence where you are working: a blue glow for the cursor and pink jelly for the matching bracket and references.

The colours come from [emerald-ocean/palette](https://github.com/emerald-ocean/palette) and match [emerald-ocean.nvim](https://github.com/emerald-ocean/emerald-ocean.nvim).

## Install

From a packaged extension (requires Node.js):

```sh
make package
code --install-extension dist/emerald-ocean-*.vsix
```

Then pick **Emerald Ocean** under *Preferences: Color Theme*.

## Semantic highlighting

The theme enables semantic highlighting, so language servers that provide semantic tokens (gopls, TypeScript, rust-analyzer) colour type definitions, struct fields, parameters and constants the same way as the Neovim theme.

For Go, gopls sends semantic tokens only when asked. Without them, VS Code's Go grammar cannot tell a package from a type (`time` in `time.Time`), a field from a variable (`s.store`), or a field definition from a composite literal key. Turn them on, but leave keywords and strings to the theme so declaration keywords and string quotes keep their colours:

```json
"gopls": {
  "ui.semanticTokens": true,
  "ui.semanticTokenTypes": { "keyword": false, "string": false }
}
```

## Inside strings

The extension adds small injection grammars, so JSON in JavaScript and TypeScript strings, format specifiers (`%s`), route placeholders (`/:id`, `/$id`, `/$(id)`, `/{id}`) in JavaScript, TypeScript and Go, and the quotes in Go struct tags are coloured like in Neovim.

## Development

The theme in `themes/` is generated at build time from `templates/` with the colours of [emerald-ocean/palette](https://github.com/emerald-ocean/palette) and is not committed. The palette version is pinned in the `Makefile`.

```sh
make generate      # generate themes/emerald-ocean-color-theme.json
make lint package  # validate and build dist/emerald-ocean-<version>.vsix
make update-palette VERSION=vX.Y.Z  # move to a new palette release
```

CI runs the same targets and keeps the packaged `.vsix` as a build artifact.

The `Palette sync` workflow checks daily (or on demand from the Actions tab) for a new palette release and opens a PR that bumps the version: `feat:` when the generated colours changed, `chore:` when they did not.

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). Every push to `main` updates a release PR with the next version, worked out from the conventional commit messages, and the matching version in `package.json` and `package-lock.json`. Merging that PR tags `vX.Y.Z`, publishes a GitHub Release with the notes and the `.vsix` attached, and publishes the extension to the Visual Studio Marketplace with [Trusted Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) (OpenID Connect, no stored token) from the `marketplace` environment.

## Icon

The icon is derived from ["Vortex" by Matt Hardy](https://unsplash.com/photos/zJ-Cj3nT6EU) on Unsplash, used under the Unsplash License.

## License

MIT
