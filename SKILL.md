---
name: review-guide
description: Write a guided code review of a diff or PR as a single portable REVIEW-GUIDE-<branch>.md file, in the exact format the Review Guide reader opens by drag-and-drop. Use when asked to write a review guide, a review tour, a "review-guide.md", or to produce a shareable, step-by-step code review that someone can open without any app, extension, or account — this works from any diff, in any repo, with no dependency on Monkey Maestro.
---

# Review Guide writer

Produce one Markdown file that narrates a diff as a sequence of reviewable
steps, each anchored to the exact lines or files it explains. A person opens
it by dragging it into the Review Guide reader, which renders the same
click-through, keyboard-navigable walkthrough Monkey Maestro's own guided
review gives — but the file itself is plain, portable Markdown: anyone can
also just read it, or open it in any editor. Producing it needs nothing
beyond `git` and the diff itself; no app, plugin, or account is required on
either end.

## 1. Gather the diff

Resolve the branch, base, and head being reviewed, then get the patch:

    git diff --no-ext-diff --no-textconv -M <base>...<head>

For a GitHub PR, `gh pr diff <number> --patch` gives the same shape. Keep
the base and head refs (or SHAs) — they go in the output.

## 2. Write the steps

Work out the destination first: the one- or two-sentence outcome this change
achieves and why it matters. That becomes `goal`, and it is the reviewer's
first line — they should know where the change is headed before seeing step
one.

Then divide the change into 4–8 bite-sized steps, not 1–2 dense ones. Each
step is one clear intention, logical unit, or architectural decision. Order
them in the chronological, logical build order that reaches the goal —
foundational pieces before what depends on them — so reading step 1 through
N tells the story of how the goal was achieved, not a shuffled list of edits.

Per step:
- `summary`: 1 punchy sentence.
- `before` / `after`: 1–2 brief sentences each on the behavior change.
- `reason`: 1–2 brief sentences on why.
- `risks`: a short array of pitfalls, edge cases, or breaking changes worth
  a second look — `[]` if there genuinely are none.

No long paragraphs, no filler, no repeating whole code blocks — the diff
itself is right below each step in the reader.

Every anchor needs a `note`: one concise sentence on what these exact lines
or this file do *in the context of this step*. When a step touches several
locations, each anchor's note must say why *that* location specifically
changed (e.g. "Adds minNights to the availability mapping" vs. "Adds the
unit test asserting the arrival minimum is preserved").

Set `certainty` to `"certain"` when the diff and context make the change and
its intent clear. Use `"needs-verification"` only when it relies on an
external contract or assumption you can't confirm from the diff alone.

`semanticKey` names the intent itself in kebab-case (e.g.
`"add-session-timeout"`), not its wording — a human trait, not a
description of this edit.

Every step needs at least one anchor: a `"lines"` anchor for a text change
(pointing at the range in the *new* file), or a file-level anchor
(`"added"` / `"modified"` / `"deleted"` / `"binary"` / `"image"` /
`"renamed"`) for a file that has no meaningful line range — added, deleted,
renamed, binary, or an image. An `"image"` anchor is for image file
extensions specifically; other non-text files are `"binary"`.

A `"lines"` anchor's `startLine`/`endLine` are 1-based and non-inverted:
`startLine` must be at least 1 and no greater than `endLine`. And every
anchor's `filePath` must match a `path` in the `files` array you build in
step 3 exactly — that's how the reader locates the diff to show under it.

## 3. Build the `files` array from the diff — exact shapes matter here

This is the part a reader has to trust byte-for-byte, so transcribe it
mechanically from the diff rather than summarizing it.

One entry per changed file:

    {
      "path": "src/Foo.res",
      "oldPath": null,
      "change": "Modified",
      "hunks": [ ... ]
    }

- `change` is one of `"Added"`, `"Modified"`, `"Deleted"`, `"Renamed"`,
  `"Binary"` — **capitalized**, from the diff's own markers (`new file
  mode` → Added, `deleted file mode` → Deleted, `rename from`/`rename to` →
  Renamed, `Binary files ... differ` / `GIT binary patch` → Binary,
  otherwise Modified).
- `oldPath` is the pre-rename path (only set for a rename); `null`
  otherwise.
- A binary/image file (no hunks to show) still gets an entry — with
  `"hunks": []` — so the reader can show it exists even with nothing to
  diff.

Each hunk comes straight from a `@@ -oldStart,oldLines +newStart,newLines @@`
header:

    {
      "header": "",
      "oldStart": 12, "oldLines": 2,
      "newStart": 12, "newLines": 3,
      "lines": [ ... ]
    }

Then walk that hunk's lines with two running counters, `oldLine` starting
at `oldStart` and `newLine` starting at `newStart`, and for each line:

| Prefix | `kind`      | `content`          | `oldLine` / `newLine`                          |
|--------|-------------|---------------------|-------------------------------------------------|
| `+`    | `"Added"`   | text after the `+`  | `oldLine: null`, `newLine: <newLine>`, then `newLine += 1` |
| `-`    | `"Removed"` | text after the `-`  | `oldLine: <oldLine>`, `newLine: null`, then `oldLine += 1` |
| ` `    | `"Context"` | text after the space| both set to current, then **both** `+= 1`        |

Note `kind` here (`Added`/`Removed`/`Context`) is capitalized too, and is a
*different* vocabulary from an anchor's `kind` (`lines`/`added`/`modified`/
…, lowercase). Don't cross the two.

## 4. Assemble the review object

    {
      "id": "review-1",
      "projectId": "<repo name or path>",
      "cwd": "<repo path>",
      "baseCommit": "<base ref or SHA>",
      "headCommit": "<head ref or SHA>",
      "goal": "<the one/two-sentence destination from step 2>",
      "steps": [
        {
          "id": "<same as semanticKey, or any stable string>",
          "semanticKey": "kebab-case-intent",
          "title": "short imperative title",
          "summary": "...", "before": "...", "after": "...", "reason": "...",
          "risks": [],
          "certainty": "certain",
          "anchors": [
            {"kind": "lines", "filePath": "src/Foo.res", "startLine": 12, "endLine": 14,
             "note": "...", "reviewerNote": null}
          ],
          "status": "unreviewed"
        }
      ],
      "questions": []
    }

`id` (review-level) can be any short unique string. `status` is always
`"unreviewed"` — a freshly written guide has no reviewer decisions yet; that
only happens in the reader. `questions` is always `[]` for the same reason.
`projectId`/`cwd` aren't load-bearing for rendering — anything descriptive
is fine.

## 5. Wrap it in the file

The whole thing is one Markdown file: a short human-readable header, then
the review and the diff embedded as one fenced JSON block —
`{"review": <the object above>, "files": <the array from step 3>, "branch":
"<branch name or null>", "repoUrl": "<the repo's canonical GitHub web
address, or null>"}`.

`repoUrl` is optional — omit the key or set it `null` if you don't know it.
When you do (e.g. resolved from the git remote, or from `gh repo view`),
include it as the repo's canonical GitHub web address — scheme, host,
owner, repo, no trailing slash and no `.git` suffix: it's what the reader
falls back to for "open this file" when the reviewer isn't on the machine
the guide was generated on.

    # <goal, verbatim>

    <file count> file(s) · <step count> step(s) · 0 understood · 0 needs review

    > Drag this file into the Review Guide reader for the interactive walkthrough. The block below is machine-readable data, not meant to be read directly.

    <!-- monkey-review-guide:v1 -->
    ```json
    {"review": {...}, "files": [...], "branch": "...", "repoUrl": "..."}
    ```

Reproduce the marker comment (`<!-- monkey-review-guide:v1 -->`) and the
` ```json ` fence exactly — the reader looks for both. If any line in the
diff itself contains a literal ` ``` `, widen the fence to one backtick more
than the longest backtick run anywhere in the JSON (4, 5, … backticks —
matching, opening and closing), so the block can't be closed early by the
diff's own content.

## 6. Name and save it

`REVIEW-GUIDE-<branch-slug>.md`, or `REVIEW-GUIDE.md` with no branch. Slug
the branch the same way a filename ever is: lowercase is not required, but
strip path separators and `.`/`..` segments, replace anything outside
`[A-Za-z0-9._-]` with `-`, and collapse repeats — `feature/login` →
`REVIEW-GUIDE-feature-login.md`.

## 7. Open it for the reviewer

If you're running locally with a GUI (skip this in a headless/remote
session), a pre-built copy of the reader ships right next to this file, at
`reader/`. Nothing about how this skill got here — `npx skills add`, a
manual copy, anything else — tells you what's actually on this machine's
PATH, so don't assume a runtime; detect one.

Copy the reader into a tmp dir and splice the guide into it as a base64
data island — this part only needs coreutils (`base64`, `grep`, `head`,
`tail`), present on essentially any Unix-like machine, so it always runs:

    tmp="$(mktemp -d)"
    cp -R "<this skill's own reader/ directory>/." "$tmp/"
    line=$(grep -n '</body>' "$tmp/index.html" | head -1 | cut -d: -f1)
    head -n $((line - 1)) "$tmp/index.html" > "$tmp/index.new.html"
    printf '<script id="monkey-embedded-guide" type="text/plain">' >> "$tmp/index.new.html"
    base64 < "<path-to-the-saved-file>" | tr -d '\n' >> "$tmp/index.new.html"
    printf '</script>\n' >> "$tmp/index.new.html"
    tail -n +"$line" "$tmp/index.html" >> "$tmp/index.new.html"
    mv "$tmp/index.new.html" "$tmp/index.html"

Reading the guide by **path** (never interpolating its content into a shell
command) sidesteps any quoting risk from backticks, quotes, or
`$(...)`-looking text inside the diff — and piping the base64 output
through redirects rather than a command-line argument keeps this working
even for a large guide, clear of shell argument-length limits. The
`<script type="text/plain">` data island is inert — never executed — and
base64 can't collide with `</script>` or any markup, so no HTML-escaping is
needed either. `<this skill's own reader/ directory>` is wherever you
actually loaded this `SKILL.md` from — same convention any other skill's
sibling reference directory uses.

**Then serve it.** A plain `file://` open does *not* work — Chrome refuses
to load the reader's module script under the `file:` scheme (CORS blocks it
outright) — so this needs an actual HTTP origin, and *that* part does need
some runtime to host it. Try, in order, whatever is actually on PATH, and
fall all the way back to the hosted reader if nothing is:

    pidfile="/tmp/.monkey-review-guide-server.pid"
    [ -f "$pidfile" ] && kill "$(cat "$pidfile")" 2>/dev/null

    if command -v python3 >/dev/null 2>&1; then
      port=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')
      (cd "$tmp" && python3 -m http.server "$port" --bind 127.0.0.1 >/dev/null 2>&1 &
       echo $! > "$pidfile")
      sleep 0.3
      open "http://127.0.0.1:$port/"
    elif command -v npx >/dev/null 2>&1; then
      port=$(node -e "const s=require('net').createServer();s.listen(0,'127.0.0.1',()=>{process.stdout.write(String(s.address().port));s.close()})")
      (cd "$tmp" && npx --yes serve -l "$port" --no-port-switching -L >/dev/null 2>&1 &
       echo $! > "$pidfile")
      sleep 1
      open "http://127.0.0.1:$port/"
    else
      open https://monkey-reader.sheri11.app
      open -R "<path-to-the-saved-file>"
    fi

Deliberately **not** `nohup`'d or disowned: left as a plain background job,
it's whatever the executing agent's own process/session model already does
with child processes when a task or session ends — which is as close to
"cleans itself up" as a portable shell recipe can honestly promise, since
that behavior isn't something this skill controls or can verify across
different agents. If your agent harness has its own tracked-background-task
primitive (e.g. Claude Code's Bash tool has a `run_in_background` option),
prefer that over the plain `&` above — it ties the server to a stoppable
task instead of a bare detached process, which is the closest thing to
guaranteed cleanup actually available here.

The pidfile check keeps at most one of these servers running at a time
rather than accumulating one per guide opened, regardless of which of the
above started it. To free one immediately rather than wait on however its
session ends:

    kill "$(cat /tmp/.monkey-review-guide-server.pid)" 2>/dev/null
    rm -f /tmp/.monkey-review-guide-server.pid

The final `else` branch above is also what to use directly whenever neither
runtime is available, the reviewer isn't on this machine, or the guide is
being handed to someone without the skill installed at all: `open -R`
reveals the file selected in its Finder window rather than just opening
the folder, so the reviewer drags it straight from there into the
already-open browser tab. Adapt for non-macOS (`xdg-open` on Linux has no
reveal-and-select equivalent — just open the containing folder; on
Windows, `explorer /select,<path>`).
