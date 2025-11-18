# VS Code Configuration for Tailwind CSS

This folder contains VS Code configuration files to handle Tailwind CSS related warnings and errors.

## Files Overview

### `settings.json`
Main VS Code settings file that:
- Disables CSS validation to ignore Tailwind directives
- Configures unknown at-rules and properties to be ignored
- Associates CSS files with Tailwind CSS language mode
- Enables Tailwind CSS intellisense for TypeScript/React

### `css.config.json`
Specific CSS validation configuration that:
- Ignores unknown at-rules (@tailwind, @apply, etc.)
- Ignores unknown properties 
- Disables vendor prefix validation
- Maintains other useful CSS validation

### `css-references.json`
Tailwind CSS references for better syntax highlighting and intellisense.

## Issues Fixed

This configuration resolves the following VS Code warnings:
- `Unknown at rule @tailwind`
- `Unknown at rule @apply`
- `Unknown at rule @layer`
- `Unknown properties` warnings
- CSS validation errors for Tailwind CSS

## Usage

The configuration is automatically applied when you open this project in VS Code. No additional setup required.

## Requirements

Recommended VS Code extensions:
- Tailwind CSS IntelliSense
- PostCSS Language Support
- Auto Rename Tag
- Prettier - Code formatter

To install these extensions, run:
```bash
code --install-extension bradlc.vscode-tailwindcss
code --install-extension mrmlnc.vscode-postcss
code --install-extension formulahendry.auto-rename-tag
code --install-extension esbenp.prettier-vscode
```