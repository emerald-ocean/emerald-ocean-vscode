VSCE := npx --yes @vscode/vsce@4.1.0

.PHONY: package
package:
	mkdir -p dist
	$(VSCE) package --no-dependencies --out dist/
