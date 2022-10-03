# windmill-cli

## Todo

- [x] Add read from .env
- [x] Write push command
- [x] Write pull command

## Build

`$ make`

Required permissions: 

- `--allow-env` to get environment variables `WM_BASE_URL` and `WM_TOKEN`
- `--allow-read` to read the .env file
- `--allow-net` to pull data from the Hub
- `--allow-write` to save scripts from remote to local

## Run 

`$ ./wmc --help`

Will attempt to read the following variables from the environment, or .env file:

**`WM_TOKEN`**  
**`WM_BASE_URL`**