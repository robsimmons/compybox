#!/usr/bin/env bash

ulimit -t 120


# Resolve any symlinks in arguments
LEAN4EXPORT_DIR="$(realpath "$1")" 
shift
OUTPUT_DIR="$(realpath "$1")"  # The directory where overlay writes went
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
    --ro-bind "$LEAN_ROOT" /lean \
    --ro-bind "$(dirname LEAN4EXPORT_DIR)" /lean4export \
    \
    --dev /dev	\
    --tmpfs /tmp \
    --proc /proc \
    \
    --clearenv \
    --setenv PATH "$GIT_PATH:$DIRNAME_PATH" \
    \
    --bind "$PWD" "/project" \
    --bind "$OUTPUT_DIR/.lake/build" "/project/.lake/build" \
    --remount-ro "/project" \
    \
    --unshare-all  \
    --die-with-parent \
    --chdir /project \
    \
    /lean/bin/lake env /lean4export/lean4export Init $MODULE_NAME -- "$@"