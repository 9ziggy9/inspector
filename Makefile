TSC_CMD=npx tsc
BUILD_DIR=./dist
GIT_USERNAME=GitHub Actions
GIT_EMAIL=davidarogers@protonmail.com
REPO=git@github.com:9ziggy9/inspector.git
PROD_BRANCH=production

all: deploy

build_ts:
	@echo "Building TypeScript"
	$(TSC_CMD)
	cd $(BUILD_DIR)

deploy: build_ts
	cd $(BUILD_DIR) && \
	git init && \
	git config user.name "$(GIT_USERNAME)" && \
	git config user.email "$(GIT_EMAIL)" && \
	git add . && \
	git commit -m "AUTOMATED: from production Makefile -- Committer $(whoami): $(date +"%Y-%m-%d %H:%M:%S")" && \
	git push --force $(REPO) master:$(PROD_BRANCH)

clean:
	rm -rf $(TSC_BUILD)
