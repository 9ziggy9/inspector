TSC_CMD=npx tsc
BUILD_DIR=./dist
REPO=git@github.com:9ziggy9/inspector.git
PROD_BRANCH=production
GIT_USERNAME=9ziggy9
GIT_EMAIL=davidarogers@protonmail.com

all: build_ts build_html deploy clean git_clean

local: build_ts build_html

build_ts:
	@echo "Building TypeScript"
	$(TSC_CMD)

build_html:
	@echo "Moving static entry point."
	cp ./index.html $(BUILD_DIR)/

deploy:
# Guard for failed build
	if [ ! -d "dist" ]; then \
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
		echo "Failed to remove worktree, does directory exist?"; \
	fi
	rm -rf deploy_dir

clean:
	rm -rf $(BUILD_DIR)
