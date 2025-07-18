# PR Test for Claude Code Action

This directory contains test files for verifying Claude Code Action functionality in Pull Requests.

## Files in this test:

- `hello_world.py` - Simple Python script for testing
- `PR_TEST_README.md` - This documentation file

## Purpose

This PR is created to test that Claude Code Action can:
1. Respond to @claude mentions in PR descriptions
2. Respond to @claude mentions in PR comments 
3. Respond to @claude mentions in PR reviews

## Expected Behavior

When @claude is mentioned in any PR context, the GitHub Action should trigger and Claude should respond appropriately.