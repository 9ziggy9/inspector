TSC_CMD=npx tsc
BUILD_DIR=./dist
GIT_USERNAME=9ziggy9
GIT_EMAIL=davidarogers@protonmail.com
GIT_REPO=https://${GH_TOKEN}@github.com/$(GIT_USERNAME)/inspector.git master:production
COMMIT_MSG="AUTOMATED: from production Makefile -- Committer $(whoami): $(date +"%Y-%m-%d %H:%M:%S")"

all:
	@echo "ayy lmao"

deploy: git_config compile_ts git_push

git_config:
	@echo "Hitting deployment CI... "
	@echo "Configuring git user data."
	git config user.name $(GIT_USERNAME)
	git config user.email $(GIT_EMAIL)

compile_ts:
	@echo "Building TypeScript"
	$(TSC_CMD)
	cd $(BUILD_DIR)

git_push:
	@echo "Adding and committing to production."
	@echo $(COMMIT_MSG)
	git add .
	git commit -m $(COMMIT_MSG)

clean:
	rm -rf $(TSC_BUILD)
