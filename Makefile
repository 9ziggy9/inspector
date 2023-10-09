TSC_CMD=npx tsc
BUILD_DIR=./dist
REPO=git@github.com:9ziggy9/inspector.git
PROD_BRANCH=production

all: build_ts deploy

build_ts:
	@echo "Building TypeScript"
	$(TSC_CMD)

deploy:
	cd $(BUILD_DIR)
	git add .
	git commit -m "Automated push to production from Makefile: $(date)"
	git push --force $(REPO) master:$(PROD_BRANCH)

clean:
	rm -rf $(BUILD_DIR)
