TSC_CMD=npx tsc
TSC_BUILD=./build

all: ./src/main.ts
	echo "Building TypeScript"
	$(TSC_CMD)

clean:
	rm -rf $(TSC_BUILD)
