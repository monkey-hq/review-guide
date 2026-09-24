# review-guide

An agent skill that writes a guided code review of a diff or PR as a single
portable `REVIEW-GUIDE-<branch>.md` file. The file narrates the diff as a
sequence of reviewable steps, each anchored to the exact lines or files it
explains — no app, plugin, or account required on either end, just `git`.

## Install

```
npx skills add monkey-hq/review-guide
```

This works with any client the `skills` CLI supports (Claude Code, OpenCode,
Codex, Cursor, etc).

## Use

Ask your agent to write a review guide for a diff, a PR, or a branch. It
produces `REVIEW-GUIDE-<branch>.md` — plain, portable Markdown that also
reads fine in any editor.

## View

Drag the resulting `REVIEW-GUIDE-*.md` file into the
[Review Guide reader](https://monkey-reader.sheri11.app) for the interactive,
step-by-step walkthrough.
