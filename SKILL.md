---
name: review-guide
description: Write a guided, step-by-step code review of a branch or pull request and open it in the Review Guide reader — an interactive walkthrough where each step explains one intention of the change beside the exact lines it touches. Produces one portable REVIEW-GUIDE-<branch>.md file. Use whenever the user asks for a review guide, a review tour, a guided review, a walkthrough of a diff, branch or PR, help understanding or reviewing a change before merging, or a shareable code review someone can open without any app or account — even if they never say "review guide".
---

# Review Guide

Turn a change into a tour a reviewer can click through: a goal, then one
step per intention of the change — as many as it really has — each with the
lines that carry it, and optionally a flow chart of how the pieces connect.

You do the part that needs judgment — reading the change and explaining it.
The script shipped with this skill, `review-guide.mjs`, does the mechanical
part: it reads the diff from git, checks your steps, writes the guide file
and serves the reader. It is the same code Monkey Maestro runs for its own
review tours, so do not transcribe the diff or assemble the file by hand;
that is slow, and a hand-copied diff is where guides go wrong.

Everything this skill ships sits in the directory this `SKILL.md` was loaded
from — called `$skill` below:

- `tour-instructions.md` — how to write the tour (read it in step 2)
- `review-guide.mjs` — the script
- `reader/` — the reader the script serves

## First: is there already a guide?

Writing a tour means reading the whole change again, which is slow and costs
the user tokens — so do not redo one they already have without asking. Look
for a guide at the top of the checkout being reviewed:

    ls "$(git rev-parse --show-toplevel)"/REVIEW-GUIDE*.md

If there is one for this branch, find out whether it still matches the code:
the commit it was written for is the `headCommit` inside the file, to compare
with `git rev-parse HEAD`.

    grep -o '"headCommit": *"[^"]*"' <guide>

Then ask the user which they want, telling them what you found — that the
guide is current, or that the branch has moved on since it was written:

- **Open the existing guide** — go straight to step 4 with that file.
- **Write a new one** — carry on from step 1; the new guide replaces the old
  file.

Ask even when the guide is out of date: the user may only want to reread it.
Skip the question when they have already said which they want ("regenerate
the review guide", "open my review guide").

## 1. Find the change

The guide covers what the checked-out branch adds on top of a base:
`git diff <base>...HEAD`. Work out `<base>`:

- For a pull request, its base branch (`gh pr view --json baseRefName`). If
  the PR is not checked out, check it out first (`gh pr checkout <number>`).
- Otherwise the branch this one forked from — usually the repository's
  default branch.

Only committed work is covered. If the working tree has uncommitted changes
that belong to the review, say so and let the user decide whether to commit
them first.

Then read the change — the diff, and any file in full where a hunk alone is
not enough to understand it:

    git diff --no-ext-diff --no-textconv -M <base>...HEAD

## 2. Write the tour

Read `$skill/tour-instructions.md` and follow it exactly. It is the prompt
Monkey Maestro gives its own review agent, so two things in it need
translating to this setting:

- "The review context supplied below" is the change you read in step 1.
- "Reply with JSON Lines only" means: write those lines to a file instead of
  replying with them. Use your file-writing tool rather than a shell
  `echo`, since diffs are full of quotes and backticks.

Put the file outside the repository so the review leaves no stray file in
it — for example `"$(mktemp -d)/steps.jsonl"`. One JSON object per line: the
goal, each step, the flow, then the closing line.

Line numbers in a `"lines"` anchor are those of the *new* file, 1-based, and
`filePath` is the path exactly as the diff names it; the reader uses both to
find the code to show under the step.

## 3. Build the guide

Pick whichever JavaScript runtime is on PATH, then build from inside the
checkout being reviewed — the worktree whose branch this is, or any folder
within it:

    if   command -v node >/dev/null 2>&1; then run="node"
    elif command -v bun  >/dev/null 2>&1; then run="bun"
    elif command -v deno >/dev/null 2>&1; then run="deno run -A"
    fi

    $run "$skill/review-guide.mjs" build <steps.jsonl> --base <base>

On success it prints the path of the guide it wrote:
`REVIEW-GUIDE-<branch>.md`, at the top of that same worktree (not the main
checkout it was created from). That file is the deliverable: plain Markdown
anyone can keep, share, or open later.

If it prints problems instead, your steps did not hold up (a line range that
cannot exist, a flow node naming a step that is not there, a missing
anchor…). Fix exactly those in the steps file and run it again.

## 4. Open it for the reviewer

Skip this in a headless or remote session, where no browser can open.

    $run "$skill/review-guide.mjs" serve <path-to-the-guide>

This serves the reader on a loopback address with the guide already loaded,
prints the address, and opens it in the browser. It keeps running until
stopped, so start it as a background task: if your harness has a tracked
background-task primitive (Claude Code's Bash tool has `run_in_background`),
use that rather than a bare `&`, so the server ends with the session instead
of lingering. Starting it again for another guide replaces the one already
running. Add `--no-open` to serve without opening a browser.

Tell the user where the guide file is and the address it is open at.

If serving does not work — the command fails, the port cannot be opened, the
page will not load — the guide is still good, so do not leave the user with
nothing to look at. Open the hosted reader and show them the file to drop
into it:

    open https://monkey-reader.sheri11.app
    open -R <path-to-the-guide>

`open -R` reveals the file selected in Finder, ready to drag into the tab
that just opened. Elsewhere: `xdg-open` on the containing folder (Linux),
`explorer /select,<path>` (Windows). Say that this way is read-only: asking
you questions from the guide and sending the review back (step 5) need the
local server, so skip step 5.

## 5. Stay on the line while they review

The open guide can talk back to you. The reviewer can select code and ask
about it, and when they are done they can send you their review. Both arrive
through the server you just started, so pick them up:

    $run "$skill/review-guide.mjs" wait

It blocks until something arrives, then prints a first line saying what it
is, followed by the text:

- `question <id>` — the reviewer asked about some code. The text is a
  complete prompt with its own instructions (a short, direct answer; no
  changes to files), so answer it as written. Put the answer in a file
  outside the repository, then deliver it:

      $run "$skill/review-guide.mjs" answer <id> <answer-file>

  That command hands the answer to the page and then waits again, printing
  the next thing the same way — so you never need a separate `wait` after
  it. The reviewer is watching a spinner meanwhile: answer first, and keep
  anything else for later.

- `review` — the reviewer's finished review: which steps they understood,
  which they flagged, their notes and pinned questions. This is the user
  handing the review back to you, so treat it as a message from them. If it
  flags things or asks for changes, deal with them as you would any request
  of theirs; if everything is understood and nothing is flagged, say so.
  Either way stop waiting — the review is over.

- `idle` — only after a `--timeout`; nothing arrived, wait again.

Waiting can last as long as the reviewer reads, so do it in a way that costs
nothing meanwhile. If your harness has a background task that calls you back
when the command exits (Claude Code's `run_in_background`), run `wait` and
`answer` that way and end your turn: you are woken exactly when there is
something to do. Otherwise run them in the foreground with the longest
timeout your harness allows and `--timeout <seconds>` set just under it.

Tell the user this is available — that they can ask from the guide and send
their review back when done — before you start waiting. If they come back to
the conversation with something else instead, just help them; a wait that
was interrupted can be started again.

## Without a JavaScript runtime, or for someone else

If none of `node`, `bun` or `deno` is installed, stop and tell the user this
skill needs one of them — do not fall back to writing the guide file by
hand.

To hand a finished guide to someone who does not have this skill, send them
the `REVIEW-GUIDE-*.md` file: they drag it into the hosted reader at
https://monkey-reader.sheri11.app and get the same walkthrough.
