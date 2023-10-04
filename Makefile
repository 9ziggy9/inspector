TSC_CMD=npx tsc
TSC_BUILD=./dist

all:
	@echo "ayy lmao"

compile_ts: ./src/main.ts
	@echo "Building TypeScript"
	$(TSC_CMD)

deploy: 
	@echo "Hitting deployment CI"
	@echo ${GH_TOKEN}

clean:
	rm -rf $(TSC_BUILD)
