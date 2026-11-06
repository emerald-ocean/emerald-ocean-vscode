PALETTE_VERSION := v0.1.0
EMERALD_GEN := go run github.com/emerald-ocean/palette/cmd/emerald-gen@$(PALETTE_VERSION)
VSCE := node_modules/.bin/vsce
THEME := themes/emerald-ocean-color-theme.json
TEMPLATE := templates/emerald-ocean-color-theme.json.tmpl

.PHONY: generate package

generate:
	mkdir -p themes
	$(EMERALD_GEN) generate -template $(TEMPLATE) -out $(THEME)

node_modules: package-lock.json
	npm ci --ignore-scripts
	touch node_modules

package: generate node_modules
	mkdir -p dist
	$(VSCE) package --no-dependencies --out dist/
