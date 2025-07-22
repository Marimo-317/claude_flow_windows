#!/bin/bash

# Read the base64 content
CONTENT=$(cat workflow-base64.txt)

# Create the workflow file via GitHub API
gh api repos/Marimo-317/lunar-wallpaper/contents/.github/workflows/claude-flow-auto-resolver.yml \
  --method PUT \
  --field message="Add Claude Flow automation workflow" \
  --field content="$CONTENT" \
  --field branch="master"