PALETTE_VERSION := v0.2.0
EMERALD_GEN := go run github.com/emerald-ocean/palette/cmd/emerald-gen@$(PALETTE_VERSION)
VSCE := node_modules/.bin/vsce
THEME := themes/emerald-ocean-color-theme.json
TEMPLATE := templates/emerald-ocean-color-theme.json.tmpl
VSCODE_REF := 69047191fc427f2f92828279aae1d90d8eeda7ab
GRAMMARS := javascript/syntaxes/JavaScript.tmLanguage.json json/syntaxes/JSON.tmLanguage.json go/syntaxes/go.tmLanguage.json \
	yaml/syntaxes/yaml.tmLanguage.json yaml/syntaxes/yaml-1.0.tmLanguage.json yaml/syntaxes/yaml-1.1.tmLanguage.json \
	yaml/syntaxes/yaml-1.2.tmLanguage.json yaml/syntaxes/yaml-1.3.tmLanguage.json yaml/syntaxes/yaml-embedded.tmLanguage.json

.PHONY: generate lint package publish scopes palette-version update-palette

generate:
	mkdir -p themes
	$(EMERALD_GEN) generate -template $(TEMPLATE) -out $(THEME)

lint: generate
	jq empty package.json $(THEME)

node_modules: package-lock.json
	npm ci --ignore-scripts
	touch node_modules

package: generate node_modules
	mkdir -p dist
	$(VSCE) package --no-dependencies --out dist/

publish: package
	$(VSCE) publish --oidc --packagePath dist/*.vsix

grammars: grammars.sha256
	rm -rf grammars && mkdir -p grammars
	for g in $(GRAMMARS); do curl -fsSL -o grammars/$$(basename $$g) https://raw.githubusercontent.com/microsoft/vscode/$(VSCODE_REF)/extensions/$$g || exit 1; done
	cd grammars && shasum -a 256 -c ../grammars.sha256 || { rm -rf ../grammars; exit 1; }

scopes: generate node_modules grammars
	mkdir -p dist
	node scripts/scopes.mjs --theme $(THEME) --grammars grammars --html dist/scopes.html samples/* > dist/scopes.tsv

palette-version:
	@echo $(PALETTE_VERSION)

update-palette:
	@test -n "$(VERSION)" || { echo "usage: make update-palette VERSION=vX.Y.Z"; exit 1; }
	awk -v v="$(VERSION)" '/^PALETTE_VERSION := /{$$0 = "PALETTE_VERSION := " v} {print}' Makefile > Makefile.tmp
	mv Makefile.tmp Makefile
	$(MAKE) generate
