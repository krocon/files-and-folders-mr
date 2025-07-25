#!/bin/bash

# Try launching available terminal
for term in gnome-terminal konsole xfce4-terminal xterm; do
    if command -v "$term" &>/dev/null; then
        "$term" &
        exit 0
    fi
done

echo "No supported terminal emulator found." >&2
exit 1