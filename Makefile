BUILD_CMD=npx webpack --config webpack.config.js
BUILD_DIR=./dist
NATIVE_DIR=./native
NATIVE_BUILD=npx webpack --config webpack.config.native.js

-include .env

all:
	@-make --no-print-directory clean
	@-make --no-print-directory git_clean
	@-make --no-print-directory build
	@-make --no-print-directory deploy
	@-make --no-print-directory clean
	@-make --no-print-directory git_clean

native: clean
	@echo "Building Electron native application."
	@echo "Building bundle."
	$(NATIVE_BUILD)

local: build

build:
	@echo "Building WebPack"
	$(BUILD_CMD)

deploy:
# Guard for failed build
	@if [ ! -d "dist" ]; then \
		echo "BUILD FAIL: The 'dist' distribution directory does not exist."; \
		exit 1; \
	fi

# Checkout the production branch in a sub-directory
	git clone $(PROD_REPO) deploy_dir
	cp -r $(BUILD_DIR)/* deploy_dir

# Commit changes from deploy_dir
	cd deploy_dir && \
	git config user.name "$(GIT_USERNAME)" && \
	git config user.email "$(GIT_EMAIL)" && \
	git add . && \
	(git diff --cached --quiet || git commit -m "Automated deploy to $(PROD_BRANCH) from Makefile") && \
	git push origin $(PROD_BRANCH)


# Remove deploy_dir and git worktree
git_clean:
	rm -rf deploy_dir

clean:
	rm -rf $(BUILD_DIR)
	rm -rf $(NATIVE_DIR)
