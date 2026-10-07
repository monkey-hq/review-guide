# Add real-time request cancellation with AbortController to the useChat streaming hook and UI, stopping server-side LLM token consumption when users cancel or navigate away.

2 file(s) · 3 step(s) · 0 understood · 0 needs review

> Drag this file into the Review Guide reader for the interactive walkthrough. The block below is machine-readable data, not meant to be read directly.

<!-- monkey-review-guide:v1 -->
```json
{
  "review": {
    "id": "review-nextjs-chat-abort",
    "projectId": "ai-chatbot",
    "cwd": "/ai-chatbot",
    "baseCommit": "main",
    "headCommit": "feat/streaming-abort",
    "branch": "feat/streaming-abort",
    "repoUrl": "https://github.com/vercel/ai",
    "goal": "Add real-time request cancellation with AbortController to the useChat streaming hook and UI, stopping server-side LLM token consumption when users cancel or navigate away.",
    "steps": [
      {
        "id": "abort-controller-signal",
        "semanticKey": "abort-controller-signal",
        "title": "Wire AbortController into streaming fetch call",
        "summary": "Attach an active AbortSignal to the streaming POST request and expose a stop() callback from useChat.",
        "before": "Once a completion started streaming, it ran until full completion or network disconnection with no user stop action.",
        "after": "useChat instantiates an AbortController for each message stream, attaching controller.signal to the fetch call, and exposes stop().",
        "reason": "Allows reviewers and users to stop long or hallucinated generations immediately, saving model tokens and latency.",
        "risks": [
          "Calling abort() triggers an AbortError in fetch that must be caught gracefully rather than treated as an unexpected failure."
        ],
        "certainty": "certain",
        "status": "unreviewed",
        "anchors": [
          {
            "kind": "lines",
            "filePath": "src/hooks/use-chat.ts",
            "startLine": 12,
            "endLine": 35,
            "note": "Initializes AbortController ref and passes signal to fetch request."
          }
        ]
      },
      {
        "id": "graceful-error-handling",
        "semanticKey": "graceful-error-handling",
        "title": "Handle AbortError cleanly without showing error banners",
        "summary": "Catch DOMException AbortError specifically to preserve partial streamed tokens without flashing an error state.",
        "before": "Any promise rejection in stream reader showed a toast error 'Failed to fetch response'.",
        "after": "Checks if error.name === 'AbortError' and silently sets status to 'ready' while keeping the partially generated message in history.",
        "reason": "Cancellation is an intentional user interaction, not an application crash.",
        "risks": [],
        "certainty": "certain",
        "status": "unreviewed",
        "anchors": [
          {
            "kind": "lines",
            "filePath": "src/hooks/use-chat.ts",
            "startLine": 42,
            "endLine": 58,
            "note": "Filters AbortError out of error state transitions."
          }
        ]
      },
      {
        "id": "ui-stop-button-and-hotkey",
        "semanticKey": "ui-stop-button-and-hotkey",
        "title": "Add 'Stop generating' button and Escape keybinding",
        "summary": "Render a stop button with spinner in ChatInput and listen for Escape key presses to cancel generation.",
        "before": "The send button remained disabled while generating with no stop action available.",
        "after": "When status is 'streaming', the send button transforms into a Stop button (Square icon) and pressing Escape triggers stop().",
        "reason": "Provides accessible, intuitive control over running AI streams across mouse and keyboard workflows.",
        "risks": [],
        "certainty": "certain",
        "status": "unreviewed",
        "anchors": [
          {
            "kind": "lines",
            "filePath": "src/components/chat-input.tsx",
            "startLine": 18,
            "endLine": 45,
            "note": "Renders conditional Stop button and adds window Escape listener."
          }
        ]
      }
    ],
    "questions": [],
    "flow": {
      "title": "User cancels active streaming response via UI or Escape key",
      "nodes": [
        {
          "id": "user",
          "label": "User (Esc / Stop)",
          "change": "unchanged",
          "step": null
        },
        {
          "id": "input",
          "label": "ChatInput Button",
          "change": "modified",
          "step": "ui-stop-button-and-hotkey"
        },
        {
          "id": "hook",
          "label": "useChat.stop()",
          "change": "added",
          "step": "abort-controller-signal"
        },
        {
          "id": "abort",
          "label": "AbortController.abort()",
          "change": "added",
          "step": "abort-controller-signal"
        },
        {
          "id": "fetch",
          "label": "fetch(/api/chat)",
          "change": "modified",
          "step": "graceful-error-handling"
        }
      ],
      "edges": [
        {
          "from": "user",
          "to": "input",
          "label": "clicks stop"
        },
        {
          "from": "input",
          "to": "hook",
          "label": "calls stop()"
        },
        {
          "from": "hook",
          "to": "abort",
          "label": "triggers"
        },
        {
          "from": "abort",
          "to": "fetch",
          "label": "signals abort"
        }
      ]
    }
  },
  "files": [
    {
      "path": "src/hooks/use-chat.ts",
      "oldPath": null,
      "change": "Modified",
      "hunks": [
        {
          "header": "export function useChat() {",
          "oldStart": 10,
          "oldLines": 12,
          "newStart": 10,
          "newLines": 32,
          "lines": [
            {
              "kind": "Context",
              "content": "export function useChat({ api = '/api/chat' } = {}) {",
              "oldLine": 10,
              "newLine": 10
            },
            {
              "kind": "Context",
              "content": "  const [messages, setMessages] = useState<Message[]>([])",
              "oldLine": 11,
              "newLine": 11
            },
            {
              "kind": "Context",
              "content": "  const [isLoading, setIsLoading] = useState(false)",
              "oldLine": 12,
              "newLine": 12
            },
            {
              "kind": "Added",
              "content": "  const abortControllerRef = useRef<AbortController | null>(null)",
              "oldLine": null,
              "newLine": 13
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 14
            },
            {
              "kind": "Added",
              "content": "  const stop = useCallback(() => {",
              "oldLine": null,
              "newLine": 15
            },
            {
              "kind": "Added",
              "content": "    if (abortControllerRef.current) {",
              "oldLine": null,
              "newLine": 16
            },
            {
              "kind": "Added",
              "content": "      abortControllerRef.current.abort()",
              "oldLine": null,
              "newLine": 17
            },
            {
              "kind": "Added",
              "content": "      abortControllerRef.current = null",
              "oldLine": null,
              "newLine": 18
            },
            {
              "kind": "Added",
              "content": "      setIsLoading(false)",
              "oldLine": null,
              "newLine": 19
            },
            {
              "kind": "Added",
              "content": "    }",
              "oldLine": null,
              "newLine": 20
            },
            {
              "kind": "Added",
              "content": "  }, [])",
              "oldLine": null,
              "newLine": 21
            },
            {
              "kind": "Context",
              "content": "",
              "oldLine": 13,
              "newLine": 22
            },
            {
              "kind": "Context",
              "content": "  const append = async (message: Message) => {",
              "oldLine": 14,
              "newLine": 23
            },
            {
              "kind": "Added",
              "content": "    const controller = new AbortController()",
              "oldLine": null,
              "newLine": 24
            },
            {
              "kind": "Added",
              "content": "    abortControllerRef.current = controller",
              "oldLine": null,
              "newLine": 25
            },
            {
              "kind": "Context",
              "content": "    setIsLoading(true)",
              "oldLine": 15,
              "newLine": 26
            },
            {
              "kind": "Context",
              "content": "    try {",
              "oldLine": 16,
              "newLine": 27
            },
            {
              "kind": "Removed",
              "content": "      const res = await fetch(api, { method: 'POST', body: JSON.stringify({ messages }) })",
              "oldLine": 17,
              "newLine": null
            },
            {
              "kind": "Added",
              "content": "      const res = await fetch(api, {",
              "oldLine": null,
              "newLine": 28
            },
            {
              "kind": "Added",
              "content": "        method: 'POST',",
              "oldLine": null,
              "newLine": 29
            },
            {
              "kind": "Added",
              "content": "        headers: { 'Content-Type': 'application/json' },",
              "oldLine": null,
              "newLine": 30
            },
            {
              "kind": "Added",
              "content": "        body: JSON.stringify({ messages }),",
              "oldLine": null,
              "newLine": 31
            },
            {
              "kind": "Added",
              "content": "        signal: controller.signal,",
              "oldLine": null,
              "newLine": 32
            },
            {
              "kind": "Added",
              "content": "      })",
              "oldLine": null,
              "newLine": 33
            },
            {
              "kind": "Context",
              "content": "      // read stream chunks...",
              "oldLine": 18,
              "newLine": 34
            },
            {
              "kind": "Context",
              "content": "    } catch (err: any) {",
              "oldLine": 19,
              "newLine": 35
            },
            {
              "kind": "Added",
              "content": "      if (err.name === 'AbortError') {",
              "oldLine": null,
              "newLine": 36
            },
            {
              "kind": "Added",
              "content": "        return // user intentional abort, keep existing messages",
              "oldLine": null,
              "newLine": 37
            },
            {
              "kind": "Added",
              "content": "      }",
              "oldLine": null,
              "newLine": 38
            },
            {
              "kind": "Context",
              "content": "      console.error('Chat error:', err)",
              "oldLine": 20,
              "newLine": 39
            },
            {
              "kind": "Context",
              "content": "    } finally {",
              "oldLine": 21,
              "newLine": 40
            },
            {
              "kind": "Context",
              "content": "      setIsLoading(false)",
              "oldLine": 22,
              "newLine": 41
            },
            {
              "kind": "Context",
              "content": "    }",
              "oldLine": 23,
              "newLine": 42
            }
          ]
        }
      ]
    },
    {
      "path": "src/components/chat-input.tsx",
      "oldPath": null,
      "change": "Modified",
      "hunks": [
        {
          "header": "export function ChatInput() {",
          "oldStart": 18,
          "oldLines": 10,
          "newStart": 18,
          "newLines": 25,
          "lines": [
            {
              "kind": "Context",
              "content": "export function ChatInput({ input, setInput, onSubmit, isLoading, onStop }: Props) {",
              "oldLine": 18,
              "newLine": 18
            },
            {
              "kind": "Added",
              "content": "  useEffect(() => {",
              "oldLine": null,
              "newLine": 19
            },
            {
              "kind": "Added",
              "content": "    const handleKeyDown = (e: KeyboardEvent) => {",
              "oldLine": null,
              "newLine": 20
            },
            {
              "kind": "Added",
              "content": "      if (e.key === 'Escape' && isLoading) onStop()",
              "oldLine": null,
              "newLine": 21
            },
            {
              "kind": "Added",
              "content": "    }",
              "oldLine": null,
              "newLine": 22
            },
            {
              "kind": "Added",
              "content": "    window.addEventListener('keydown', handleKeyDown)",
              "oldLine": null,
              "newLine": 23
            },
            {
              "kind": "Added",
              "content": "    return () => window.removeEventListener('keydown', handleKeyDown)",
              "oldLine": null,
              "newLine": 24
            },
            {
              "kind": "Added",
              "content": "  }, [isLoading, onStop])",
              "oldLine": null,
              "newLine": 25
            },
            {
              "kind": "Context",
              "content": "",
              "oldLine": 19,
              "newLine": 26
            },
            {
              "kind": "Context",
              "content": "  return (",
              "oldLine": 20,
              "newLine": 27
            },
            {
              "kind": "Context",
              "content": "    <form onSubmit={onSubmit} className=\"flex items-center gap-2\">",
              "oldLine": 21,
              "newLine": 28
            },
            {
              "kind": "Context",
              "content": "      <input value={input} onChange={e => setInput(e.target.value)} />",
              "oldLine": 22,
              "newLine": 29
            },
            {
              "kind": "Removed",
              "content": "      <button type=\"submit\" disabled={isLoading}>Send</button>",
              "oldLine": 23,
              "newLine": null
            },
            {
              "kind": "Added",
              "content": "      {isLoading ? (",
              "oldLine": null,
              "newLine": 30
            },
            {
              "kind": "Added",
              "content": "        <button type=\"button\" onClick={onStop} className=\"btn-stop\" title=\"Stop generating (Esc)\">",
              "oldLine": null,
              "newLine": 31
            },
            {
              "kind": "Added",
              "content": "          <StopIcon className=\"w-4 h-4\" /> Stop",
              "oldLine": null,
              "newLine": 32
            },
            {
              "kind": "Added",
              "content": "        </button>",
              "oldLine": null,
              "newLine": 33
            },
            {
              "kind": "Added",
              "content": "      ) : (",
              "oldLine": null,
              "newLine": 34
            },
            {
              "kind": "Added",
              "content": "        <button type=\"submit\">Send</button>",
              "oldLine": null,
              "newLine": 35
            },
            {
              "kind": "Added",
              "content": "      )}",
              "oldLine": null,
              "newLine": 36
            },
            {
              "kind": "Context",
              "content": "    </form>",
              "oldLine": 24,
              "newLine": 37
            },
            {
              "kind": "Context",
              "content": "  )",
              "oldLine": 25,
              "newLine": 38
            }
          ]
        }
      ]
    }
  ],
  "branch": "feat/streaming-abort",
  "repoUrl": "https://github.com/vercel/ai"
}
```
