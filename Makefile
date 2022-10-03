EXEC_NAME=wmc

all: $(EXEC_NAME)

$(EXEC_NAME): $(wildcard src/*.ts)
	deno compile --output $@ --allow-read --allow-env --allow-net --allow-write --no-check src/mod.ts
