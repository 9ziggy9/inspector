TSC_CMD=npx tsc
TSC_BUILD=./build

all: ./src/main.ts
	@echo "Building TypeScript"
	$(TSC_CMD)

deploy: 
	@echo "Hitting deployment CI"

clean:
	rm -rf $(TSC_BUILD)
