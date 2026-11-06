PALETTE_VERSION := v0.1.0
EMERALD_GEN := go run github.com/emerald-ocean/palette/cmd/emerald-gen@$(PALETTE_VERSION)
VSCE := node_modules/.bin/vsce
THEME := themes/emerald-ocean-color-theme.json
TEMPLATE := templates/emerald-ocean-color-theme.json.tmpl

.PHONY: generate lint package publish palette-version update-palette

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

palette-version:
	@echo $(PALETTE_VERSION)

update-palette:
	@test -n "$(VERSION)" || { echo "usage: make update-palette VERSION=vX.Y.Z"; exit 1; }
	awk -v v="$(VERSION)" '/^PALETTE_VERSION := /{$$0 = "PALETTE_VERSION := " v} {print}' Makefile > Makefile.tmp
	mv Makefile.tmp Makefile
	$(MAKE) generate
