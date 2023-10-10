BUILD_CMD=npx webpack --config webpack.config.js
BUILD_DIR=./dist
REPO=git@github.com:9ziggy9/inspector.git
PROD_BRANCH=production
GIT_USERNAME=9ziggy9
GIT_EMAIL=davidarogers@protonmail.com

all:
	@-make --no-print-directory clean
	@-make --no-print-directory git_clean
	@-make --no-print-directory build
	@-make --no-print-directory deploy
	@-make --no-print-directory clean
	@-make --no-print-directory git_clean

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
	git worktree add deploy_dir $(PROD_BRANCH)
	cp -r $(BUILD_DIR)/* deploy_dir

# Commit changes from deploy_dir
	cd deploy_dir && \
	git config user.name "$(GIT_USERNAME)" && \
	git config user.email "$(GIT_EMAIL)" && \
	git add . && \
	(git diff --cached --quiet || git commit -m "Automated deploy to $(PROD_BRANCH) from Makefile") && \
	git push $(REPO) HEAD:$(PROD_BRANCH)


# Remove deploy_dir and git worktree
git_clean:
	@if git worktree remove deploy_dir; then \
		echo "Worktree removed."; \
	else \
		echo "No worktree to clean. Skipping."; \
	fi
	rm -rf deploy_dir

clean:
	rm -rf $(BUILD_DIR)
