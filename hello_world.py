#!/usr/bin/env python3
"""
Simple Hello World program for testing Claude Code Action in PRs
"""

def greet(name="World"):
    """Return a greeting message"""
    return f"Hello, {name}!"

def main():
    """Main function"""
    print(greet())
    print(greet("Claude"))
    print(greet("GitHub Actions"))

if __name__ == "__main__":
    main()