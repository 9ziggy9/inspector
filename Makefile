TSC_CMD=npx tsc
BUILD_DIR=./dist
GIT_USERNAME=9ziggy9
GIT_EMAIL=davidarogers@protonmail.com
GIT_REPO=https://${GH_TOKEN}@github.com/$(GIT_USERNAME)/inspector.git master:production

all:
	@echo "ayy lmao"

deploy: git_config compile_ts

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
	git add .
	git commit -m "Automated via makefile"
	git push --force $(GIT_REPO)

clean:
	rm -rf $(TSC_BUILD)