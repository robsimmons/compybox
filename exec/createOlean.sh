#!/usr/bin/env bash

ulimit -t 120

# Resolve any symlinks in arguments
OUTPUT_DIR="$(realpath "$1")"  # The directory where overlay writes will go
shift
WORK_DIR="$(realpath "$1")"    # An empty directory on the same filesystem as OUTPUT_DIR
shift
MODULE_NAME="$1"               # The argument to `lake exe module-constants`
shift

# Lake needs to know about git and dirname to function
GIT_PATH=$(dirname $(realpath $(which git)))
DIRNAME_PATH=$(dirname $(realpath $(which dirname)))

# The LEAN_ROOT will be a path in `/home/$USER/.elan`, and we don't
# want the container to know anything about the `/home`, so
# we'll bind this directory to `/lean`
LEAN_ROOT="$(lean --print-prefix)"

exec bwrap \
    --ro-bind /nix /nix \
    --ro-bind /run /run \
    --ro-bind "$LEAN_ROOT" /lean \
    \
    --dev /dev	\
    --tmpfs /tmp \
    --proc /proc \
    \
    --clearenv \
    --setenv PATH "$PATH:$GIT_PATH:$DIRNAME_PATH" \
    \
    --overlay-src "$PWD" \
    --overlay "$OUTPUT_DIR" "$WORK_DIR" /project \
    \
    --unshare-all  \
    --die-with-parent \
    --chdir /project \
    \
    /lean/bin/lake build $MODULE_NAME