#!/usr/bin/env bash

ulimit -t 120

# Resolve any symlinks in arguments
INPUT_DIR="$(realpath "$1")"   # Where the template project lives
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
LEAN_ROOT="$(cd $INPUT_DIR && lean --print-prefix)"

exec bwrap \
    --ro-bind /nix /nix \
    --ro-bind "$LEAN_ROOT" /lean \
    \
    --dev /dev	\
    --tmpfs /tmp \
    --proc /proc \
    \
    --clearenv \
    --setenv PATH "$GIT_PATH:$DIRNAME_PATH" \
    \
    --bind "$INPUT_DIR" "/project" \
    --bind "$OUTPUT_DIR/.lake/build" "/project/.lake/build" \
    --remount-ro "/project" \
    \
    --unshare-all  \
    --die-with-parent \
    --chdir /project \
    \
    /lean/bin/lake exe lean4export Init $MODULE_NAME -- propext Classical.choice Quot.sound $@