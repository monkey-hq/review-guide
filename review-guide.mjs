import * as Nodefs from "node:fs";
import * as Nodeos from "node:os";
import * as Nodeurl from "node:url";
import * as Nodehttp from "node:http";
import * as Nodepath from "node:path";
import * as Nodecrypto from "node:crypto";
import * as Nodechild_process from "node:child_process";
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Primitive_option.js
function some(x) {
	if (x === void 0) return { BS_PRIVATE_NESTED_SOME_NONE: 0 };
	else if (x !== null && x.BS_PRIVATE_NESTED_SOME_NONE !== void 0) return { BS_PRIVATE_NESTED_SOME_NONE: x.BS_PRIVATE_NESTED_SOME_NONE + 1 | 0 };
	else return x;
}
function valFromOption(x) {
	if (x === null || x.BS_PRIVATE_NESTED_SOME_NONE === void 0) return x;
	let depth = x.BS_PRIVATE_NESTED_SOME_NONE;
	if (depth === 0) return;
	else return { BS_PRIVATE_NESTED_SOME_NONE: depth - 1 | 0 };
}
//#endregion
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Belt_Array.js
function concatMany(arrs) {
	let lenArrs = arrs.length;
	let totalLen = 0;
	for (let i = 0; i < lenArrs; ++i) totalLen = totalLen + arrs[i].length | 0;
	let result = new Array(totalLen);
	totalLen = 0;
	for (let j = 0; j < lenArrs; ++j) {
		let cur = arrs[j];
		for (let k = 0, k_finish = cur.length; k < k_finish; ++k) {
			result[totalLen] = cur[k];
			totalLen = totalLen + 1 | 0;
		}
	}
	return result;
}
//#endregion
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Stdlib_Array.js
function reduce(arr, init, f) {
	return arr.reduce(f, init);
}
function filterMap(a, f) {
	let l = a.length;
	let r = new Array(l);
	let j = 0;
	for (let i = 0; i < l; ++i) {
		let v = a[i];
		let v$1 = f(v);
		if (v$1 !== void 0) {
			r[j] = valFromOption(v$1);
			j = j + 1 | 0;
		}
	}
	r.length = j;
	return r;
}
//#endregion
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Stdlib_Int.js
function fromString(x, radix) {
	let maybeInt = radix !== void 0 ? parseInt(x, radix) : parseInt(x);
	if (Number.isNaN(maybeInt) || maybeInt > 2147483647 || maybeInt < -2147483648) return;
	else return maybeInt | 0;
}
//#endregion
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Stdlib_Dict.js
function $$delete$1(dict, string) {
	delete dict[string];
}
//#endregion
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Stdlib_JSON.js
function bool(json) {
	if (typeof json === "boolean") return json;
}
function $$null(json) {
	if (json === null) return null;
}
function string(json) {
	if (typeof json === "string") return json;
}
function float(json) {
	if (typeof json === "number") return json;
}
function object(json) {
	if (typeof json === "object" && json !== null && !Array.isArray(json)) return json;
}
function array(json) {
	if (Array.isArray(json)) return json;
}
var Decode = {
	bool,
	$$null,
	string,
	float,
	object,
	array
};
//#endregion
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Stdlib_Option.js
function filter(opt, p) {
	if (opt !== void 0 && p(valFromOption(opt))) return opt;
}
function forEach(opt, f) {
	if (opt !== void 0) return f(valFromOption(opt));
}
function mapOr(opt, $$default, f) {
	if (opt !== void 0) return f(valFromOption(opt));
	else return $$default;
}
function map(opt, f) {
	if (opt !== void 0) return some(f(valFromOption(opt)));
}
function flatMap(opt, f) {
	if (opt !== void 0) return f(valFromOption(opt));
}
function getOr(opt, $$default) {
	if (opt !== void 0) return valFromOption(opt);
	else return $$default;
}
function isSome(x) {
	return x !== void 0;
}
function isNone(x) {
	return x === void 0;
}
//#endregion
//#region ../../packages/infrastructure/src/GitText.res.mjs
function dropPrefix(value, prefix) {
	if (value.startsWith(prefix)) return value.slice(prefix.length, value.length);
	else return value;
}
function parseRange(value) {
	let parts = value.split(",");
	let start = flatMap(parts[0], (value) => fromString(value, 10));
	if (start === void 0) return;
	return [start, getOr(flatMap(parts[1], (value) => fromString(value, 10)), 1)];
}
function parseHunkHeader(line) {
	let fields = line.split(" ");
	let match = fields[1];
	let match$1 = fields[2];
	if (match === void 0) return;
	if (match$1 === void 0) return;
	let match$2 = parseRange(dropPrefix(match, "-"));
	let match$3 = parseRange(dropPrefix(match$1, "+"));
	if (match$2 === void 0) return;
	if (match$3 === void 0) return;
	let newStart = match$3[0];
	let oldStart = match$2[0];
	return {
		header: fields[4] !== void 0 ? fields.slice(4, fields.length).join(" ") : "",
		oldStart,
		oldLines: match$2[1],
		newStart,
		newLines: match$3[1],
		oldNext: oldStart,
		newNext: newStart,
		lines: []
	};
}
function completeHunk(state) {
	let active = state.active;
	if (active !== void 0) return {
		complete: state.complete.concat([{
			header: active.header,
			oldStart: active.oldStart,
			oldLines: active.oldLines,
			newStart: active.newStart,
			newLines: active.newLines,
			lines: active.lines
		}]),
		active: void 0
	};
	else return state;
}
function parseHunks(lines) {
	return completeHunk(reduce(lines, {
		complete: [],
		active: void 0
	}, (state, line) => {
		if (!line.startsWith("@@ ")) if (line.startsWith("+") || line.startsWith("-") || line.startsWith(" ")) {
			let active = state.active;
			if (active === void 0) return state;
			let content = line.slice(1, line.length);
			let match = line.charAt(0);
			let next;
			switch (match) {
				case " ":
					next = {
						header: active.header,
						oldStart: active.oldStart,
						oldLines: active.oldLines,
						newStart: active.newStart,
						newLines: active.newLines,
						oldNext: active.oldNext + 1 | 0,
						newNext: active.newNext + 1 | 0,
						lines: active.lines.concat([{
							kind: "Context",
							content,
							oldLine: active.oldNext,
							newLine: active.newNext
						}])
					};
					break;
				case "+":
					next = {
						header: active.header,
						oldStart: active.oldStart,
						oldLines: active.oldLines,
						newStart: active.newStart,
						newLines: active.newLines,
						oldNext: active.oldNext,
						newNext: active.newNext + 1 | 0,
						lines: active.lines.concat([{
							kind: "Added",
							content,
							oldLine: void 0,
							newLine: active.newNext
						}])
					};
					break;
				case "-":
					next = {
						header: active.header,
						oldStart: active.oldStart,
						oldLines: active.oldLines,
						newStart: active.newStart,
						newLines: active.newLines,
						oldNext: active.oldNext + 1 | 0,
						newNext: active.newNext,
						lines: active.lines.concat([{
							kind: "Removed",
							content,
							oldLine: active.oldNext,
							newLine: void 0
						}])
					};
					break;
				default: next = active;
			}
			return {
				complete: state.complete,
				active: next
			};
		} else return state;
		let hunk = parseHunkHeader(line);
		if (hunk === void 0) return state;
		return {
			complete: completeHunk(state).complete,
			active: hunk
		};
	})).complete;
}
function headerPaths(header) {
	let fields = header.split(" ");
	let match = fields[2];
	let match$1 = fields[3];
	if (match !== void 0 && match$1 !== void 0) return [dropPrefix(match, "a/"), dropPrefix(match$1, "b/")];
}
function lineValueAfter(lines, prefix) {
	return map(lines.find((line) => line.startsWith(prefix)), (line) => line.slice(prefix.length, line.length));
}
var diffHeader = "diff --git ";
function parsePatch(raw) {
	return filterMap(raw.split("\ndiff --git "), (block) => {
		let complete = block.startsWith(diffHeader) ? block : diffHeader + block;
		if (block === "") return;
		else {
			let lines = complete.split("\n");
			let match = flatMap(lines[0], headerPaths);
			if (match === void 0) return;
			let isAdded = lines.some((line) => line.startsWith("new file mode "));
			let isDeleted = lines.some((line) => line.startsWith("deleted file mode "));
			let renameFrom = lineValueAfter(lines, "rename from ");
			let renameTo = lineValueAfter(lines, "rename to ");
			let change = lines.some((line) => {
				if (line.startsWith("Binary files ")) return true;
				else return line === "GIT binary patch";
			}) ? "Binary" : isAdded ? "Added" : isDeleted ? "Deleted" : isSome(renameFrom) || isSome(renameTo) ? "Renamed" : "Modified";
			return {
				path: renameTo !== void 0 ? renameTo : isDeleted ? match[0] : match[1],
				oldPath: renameFrom !== void 0 ? renameFrom : void 0,
				change,
				hunks: parseHunks(lines)
			};
		}
	});
}
//#endregion
//#region ../../packages/infrastructure/src/AsyncMutex.res.mjs
function make() {
	return { tail: Promise.resolve() };
}
//#endregion
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Primitive_exceptions.js
function isExtension(e) {
	if (e == null) return false;
	else return typeof e.RE_EXN_ID === "string";
}
function internalToException(e) {
	if (isExtension(e)) return e;
	else return {
		RE_EXN_ID: "JsExn",
		_1: e
	};
}
var idMap = {};
function create(str) {
	let v = idMap[str];
	if (v !== void 0) {
		let id = v + 1 | 0;
		idMap[str] = id;
		return str + ("/" + id);
	}
	idMap[str] = 1;
	return str;
}
//#endregion
//#region ../../packages/infrastructure/src/GitProcess.res.mjs
var GitCommandFailed = /* @__PURE__ */ create("GitProcess-Infra.GitCommandFailed");
function git(cwd, args) {
	return new Promise((resolve, reject) => {
		Nodechild_process.execFile("git", args, {
			cwd,
			encoding: "utf8",
			maxBuffer: 67108864
		}, (error, stdout, stderr) => {
			if (error == null) return resolve(stdout);
			else return reject({
				RE_EXN_ID: GitCommandFailed,
				_1: stderr
			});
		});
	});
}
async function headCommit(path) {
	let out;
	try {
		out = await git(path, ["rev-parse", "HEAD"]);
	} catch (exn) {
		return;
	}
	let sha = out.trim();
	if (sha === "") return;
	else return sha;
}
async function currentBranch(path) {
	let out;
	try {
		out = await git(path, [
			"rev-parse",
			"--abbrev-ref",
			"HEAD"
		]);
	} catch (exn) {
		return;
	}
	let b = out.trim();
	if (b === "" || b === "HEAD") return;
	else return b;
}
make();
async function githubRepo(path) {
	let out;
	try {
		out = await git(path, [
			"remote",
			"get-url",
			"origin"
		]);
	} catch (exn) {
		return;
	}
	let url = out.trim();
	let stripped = url.startsWith("git@github.com:") ? url.slice(15, url.length) : url.startsWith("https://github.com/") ? url.slice(19, url.length) : url;
	let withoutGit = stripped.endsWith(".git") ? stripped.slice(0, stripped.length - 4 | 0) : stripped;
	if (withoutGit.includes("://") || !withoutGit.includes("/")) return;
	else return withoutGit;
}
function diffPatchArgs(base) {
	return [
		"diff",
		"--no-ext-diff",
		"--no-textconv",
		"-M",
		base + `...HEAD`
	];
}
async function diffPatch(path, base) {
	let patch;
	try {
		patch = await git(path, diffPatchArgs(base));
	} catch (raw_stderr) {
		let stderr = internalToException(raw_stderr);
		if (stderr.RE_EXN_ID !== GitCommandFailed) return {
			TAG: "Error",
			_0: `Could not read the diff against "` + base + `".`
		};
		let message = stderr._1.trim();
		if (message === "") return {
			TAG: "Error",
			_0: `Could not read the diff against "` + base + `".`
		};
		else return {
			TAG: "Error",
			_0: message
		};
	}
	return {
		TAG: "Ok",
		_0: patch
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@rescript+runtime@12.3.0/node_modules/@rescript/runtime/lib/es6/Primitive_object.js
var for_in = (function(o, foo) {
	for (var x in o) foo(x);
});
function equal(a, b) {
	if (a === b) return true;
	let a_type = typeof a;
	if (a_type === "string" || a_type === "number" || a_type === "bigint" || a_type === "boolean" || a_type === "undefined" || a === null) return false;
	let b_type = typeof b;
	if (a_type === "function" || b_type === "function") throw {
		RE_EXN_ID: "Invalid_argument",
		_1: "equal: functional value",
		Error: /* @__PURE__ */ new Error()
	};
	if (b_type === "number" || b_type === "bigint" || b_type === "undefined" || b === null) return false;
	if (a.TAG !== b.TAG) return false;
	let len_a = a.length | 0;
	if (len_a === (b.length | 0)) if (Array.isArray(a)) {
		let _i = 0;
		while (true) {
			let i = _i;
			if (i === len_a) return true;
			if (!equal(a[i], b[i])) return false;
			_i = i + 1 | 0;
			continue;
		}
	} else if (a instanceof Date && b instanceof Date) return !(a > b || a < b);
	else {
		let result = { contents: true };
		let do_key_a = (key) => {
			if (!Object.prototype.hasOwnProperty.call(b, key)) {
				result.contents = false;
				return;
			}
		};
		let do_key_b = (key) => {
			if (!Object.prototype.hasOwnProperty.call(a, key) || !equal(b[key], a[key])) {
				result.contents = false;
				return;
			}
		};
		for_in(a, do_key_a);
		if (result.contents) for_in(b, do_key_b);
		return result.contents;
	}
	else return false;
}
//#endregion
//#region ../../packages/domain/src/GuidedReview.res.mjs
function fromJson(json) {
	let text = (object, key) => flatMap(object[key], Decode.string);
	let objects = (object, key) => filterMap(getOr(flatMap(object[key], Decode.array), []), Decode.object);
	return flatMap(Decode.object(json), (object) => {
		let nodes = filterMap(objects(object, "nodes"), (node) => {
			let match = text(node, "id");
			let match$1 = text(node, "label");
			if (match === void 0) return;
			if (match$1 === void 0) return;
			let match$2 = text(node, "change");
			let tmp;
			if (match$2 !== void 0) switch (match$2) {
				case "added":
					tmp = "added";
					break;
				case "modified":
					tmp = "modified";
					break;
				default: tmp = "unchanged";
			}
			else tmp = "unchanged";
			return {
				id: match,
				label: match$1,
				change: tmp,
				step: text(node, "step")
			};
		});
		if (nodes.length !== 0) return {
			title: text(object, "title"),
			nodes,
			edges: filterMap(objects(object, "edges"), (edge) => {
				let match = text(edge, "from");
				let match$1 = text(edge, "to");
				if (match !== void 0 && match$1 !== void 0) return {
					from: match,
					to: match$1,
					label: text(edge, "label")
				};
			})
		};
	});
}
var Flow = { fromJson };
function validateStep(step) {
	let stepId = step.id._0;
	let semanticKeyDiagnostics = step.semanticKey.trim() === "" ? [{
		TAG: "EmptySemanticKey",
		stepId
	}] : [];
	let anchorDiagnostics = reduce(step.anchors, [], (diagnostics, anchor) => {
		if (anchor.TAG !== "Lines") return diagnostics;
		let startLine = anchor.startLine;
		if (startLine <= 0 || anchor.endLine < startLine) return diagnostics.concat([{
			TAG: "InvalidLineRange",
			stepId,
			filePath: anchor.filePath
		}]);
		else return diagnostics;
	});
	let missingAnchorDiagnostics = step.anchors.length === 0 ? [{
		TAG: "MissingAnchors",
		stepId
	}] : [];
	return semanticKeyDiagnostics.concat(missingAnchorDiagnostics).concat(anchorDiagnostics);
}
function stepIndexOf(review, semanticKey) {
	let index = review.steps.findIndex((step) => step.semanticKey === semanticKey);
	if (index !== -1) return index;
}
function validate(review) {
	return review.steps.flatMap(validateStep).concat(mapOr(review.flow, [], (flow) => {
		let defines = (id) => flow.nodes.some((node) => node.id === id);
		let unknownSteps = filterMap(flow.nodes, (node) => {
			let step = node.step;
			if (step !== void 0 && isNone(stepIndexOf(review, step))) return {
				TAG: "FlowUnknownStep",
				nodeId: node.id,
				step
			};
		});
		let unknownNodes = flow.edges.flatMap((edge) => [edge.from, edge.to]).filter((id) => !defines(id)).map((id) => ({
			TAG: "FlowUnknownNode",
			nodeId: id
		}));
		return unknownSteps.concat(unknownNodes);
	}));
}
function branchSlug(branch) {
	return getOr(branch, "").split("/").map((prim) => prim.trim()).filter((segment) => {
		if (segment !== "" && segment !== ".") return segment !== "..";
		else return false;
	}).join("-").replace(/[^A-Za-z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
}
function guideFilename(branch) {
	let slug = branchSlug(branch);
	if (slug === "") return "REVIEW-GUIDE.md";
	else return `REVIEW-GUIDE-` + slug + `.md`;
}
function encodeChange(change) {
	if (typeof change === "object") return ["renamed", change.fromPath];
	switch (change) {
		case "Added": return ["added", void 0];
		case "Modified": return ["modified", void 0];
		case "Deleted": return ["deleted", void 0];
		case "Binary": return ["binary", void 0];
		case "Image": return ["image", void 0];
	}
}
function decodeChange(kind, fromPath) {
	switch (kind) {
		case "added": return "Added";
		case "binary": return "Binary";
		case "deleted": return "Deleted";
		case "image": return "Image";
		case "modified": return "Modified";
		case "renamed": if (fromPath !== void 0) return {
			TAG: "Renamed",
			fromPath
		};
		else return;
		default: return;
	}
}
function encodeAnchor(anchor) {
	if (anchor.TAG === "Lines") return {
		kind: "lines",
		filePath: anchor.filePath,
		startLine: anchor.startLine,
		endLine: anchor.endLine,
		fromPath: void 0,
		note: anchor.note,
		reviewerNote: anchor.reviewerNote
	};
	let match = encodeChange(anchor.change);
	return {
		kind: match[0],
		filePath: anchor.filePath,
		startLine: void 0,
		endLine: void 0,
		fromPath: match[1],
		note: anchor.note,
		reviewerNote: anchor.reviewerNote
	};
}
function decodeAnchor$1(anchor) {
	let match = anchor.kind;
	let match$1 = anchor.startLine;
	let match$2 = anchor.endLine;
	if (match === "lines" && match$1 !== void 0 && match$2 !== void 0) return {
		TAG: "Lines",
		filePath: anchor.filePath,
		startLine: match$1,
		endLine: match$2,
		note: anchor.note,
		reviewerNote: anchor.reviewerNote
	};
	return map(decodeChange(match, anchor.fromPath), (change) => ({
		TAG: "File",
		filePath: anchor.filePath,
		change,
		note: anchor.note,
		reviewerNote: anchor.reviewerNote
	}));
}
function certaintyKey(certainty) {
	if (certainty === "Certain") return "certain";
	else return "needs-verification";
}
function decodeCertainty(key) {
	switch (key) {
		case "certain": return "Certain";
		default: return "NeedsVerification";
	}
}
function statusKey(status) {
	switch (status) {
		case "Unreviewed": return "unreviewed";
		case "Understood": return "understood";
		case "NeedsReview": return "needs-review";
	}
}
function decodeStatus(key) {
	switch (key) {
		case "needs-review": return "NeedsReview";
		case "understood": return "Understood";
		default: return "Unreviewed";
	}
}
function encodeStep(item) {
	return {
		id: item.id._0,
		semanticKey: item.semanticKey,
		title: item.title,
		summary: item.summary,
		before: item.before,
		after: item.after,
		reason: item.reason,
		risks: item.risks,
		certainty: certaintyKey(item.certainty),
		anchors: item.anchors.map(encodeAnchor),
		status: statusKey(item.status)
	};
}
function decodeStep$1(item) {
	return {
		id: {
			TAG: "StepId",
			_0: item.id
		},
		semanticKey: item.semanticKey,
		title: item.title,
		summary: item.summary,
		before: item.before,
		after: item.after,
		reason: item.reason,
		risks: item.risks,
		certainty: decodeCertainty(item.certainty),
		anchors: filterMap(item.anchors, decodeAnchor$1),
		status: decodeStatus(item.status)
	};
}
function encodeQuestion(question) {
	return {
		id: question.id._0,
		stepId: question.stepId._0,
		body: question.body,
		answer: question.answer,
		location: question.location,
		snippet: question.snippet,
		discussion: question.discussion
	};
}
function decodeQuestion(question) {
	return {
		id: {
			TAG: "QuestionId",
			_0: question.id
		},
		stepId: {
			TAG: "StepId",
			_0: question.stepId
		},
		body: question.body,
		answer: question.answer,
		location: question.location,
		snippet: question.snippet,
		discussion: question.discussion
	};
}
function encode(review) {
	return {
		id: review.id._0,
		projectId: review.projectId,
		cwd: review.cwd,
		baseCommit: review.baseCommit,
		headCommit: review.headCommit,
		goal: review.goal,
		steps: review.steps.map(encodeStep),
		questions: review.questions.map(encodeQuestion),
		generatedByIcon: review.generatedByIcon,
		flow: review.flow
	};
}
function decode(review) {
	return {
		id: {
			TAG: "Id",
			_0: review.id
		},
		projectId: review.projectId,
		cwd: review.cwd,
		baseCommit: review.baseCommit,
		headCommit: review.headCommit,
		goal: review.goal,
		steps: review.steps.map(decodeStep$1),
		questions: review.questions.map(decodeQuestion),
		generatedByIcon: review.generatedByIcon,
		flow: review.flow
	};
}
var Codec = {
	encode,
	decode
};
//#endregion
//#region ../../packages/domain/src/ReviewAgent.res.mjs
function stringField(obj, name) {
	return getOr(flatMap(obj[name], Decode.string), "");
}
function intField(obj, name) {
	return map(flatMap(obj[name], Decode.float), (prim) => prim | 0);
}
function decodeAnchor(value) {
	return map(Decode.object(value), (obj) => ({
		kind: stringField(obj, "kind"),
		filePath: stringField(obj, "filePath"),
		startLine: intField(obj, "startLine"),
		endLine: intField(obj, "endLine"),
		fromPath: flatMap(obj["fromPath"], Decode.string),
		note: filter(map(flatMap(obj["note"], Decode.string), (prim) => prim.trim()), (s) => s !== ""),
		reviewerNote: void 0
	}));
}
function decodeStep(value, index) {
	let obj = Decode.object(value);
	let targetObj;
	if (obj !== void 0) {
		let nested = flatMap(flatMap(flatMap(obj["steps"], Decode.array), (arr) => arr[0]), Decode.object);
		if (nested !== void 0) targetObj = nested;
		else {
			let nested$1 = flatMap(obj["step"], Decode.object);
			targetObj = nested$1 !== void 0 ? nested$1 : obj;
		}
	} else targetObj = void 0;
	return map(targetObj, (obj) => ({
		id: `step-` + index.toString(),
		semanticKey: stringField(obj, "semanticKey"),
		title: stringField(obj, "title"),
		summary: stringField(obj, "summary"),
		before: stringField(obj, "before"),
		after: stringField(obj, "after"),
		reason: stringField(obj, "reason"),
		risks: filterMap(getOr(flatMap(obj["risks"], Decode.array), []), Decode.string),
		certainty: stringField(obj, "certainty"),
		anchors: filterMap(getOr(flatMap(obj["anchors"], Decode.array), []), decodeAnchor),
		status: "unreviewed"
	}));
}
function isStreamComplete(output) {
	try {
		let root = Decode.object(JSON.parse(output));
		if (root !== void 0) return equal(flatMap(root["type"], Decode.string), "review-complete");
		else return false;
	} catch (exn) {
		return false;
	}
}
function decodeStreamGoal(output) {
	try {
		let root = Decode.object(JSON.parse(output));
		if (root === void 0) return;
		if (flatMap(root["type"], Decode.string) === "review-goal") return flatMap(root["goal"], Decode.string);
		else return;
	} catch (exn) {
		return;
	}
}
function decodeStreamFlow(output) {
	try {
		let root = Decode.object(JSON.parse(output));
		if (root === void 0) return;
		if (flatMap(root["type"], Decode.string) === "review-flow") return flatMap(root["flow"], Flow.fromJson);
		else return;
	} catch (exn) {
		return;
	}
}
function decodeStreamStep(output, index) {
	try {
		let root = Decode.object(JSON.parse(output));
		if (root === void 0) return {
			TAG: "Error",
			_0: {
				TAG: "Malformed",
				_0: "the streamed event was not a JSON object"
			}
		};
		let match = flatMap(root["type"], Decode.string);
		let match$1 = root["step"];
		let stepValue;
		let exit = 0;
		if (match === "review-step") stepValue = match$1 !== void 0 ? match$1 : root;
		else exit = 1;
		if (exit === 1) stepValue = isSome(root["semanticKey"]) ? root : void 0;
		if (stepValue === void 0) return {
			TAG: "Error",
			_0: {
				TAG: "Malformed",
				_0: "the streamed event was not a review-step"
			}
		};
		let decoded = decodeStep(stepValue, index);
		if (decoded !== void 0) return {
			TAG: "Ok",
			_0: decoded
		};
		else return {
			TAG: "Error",
			_0: {
				TAG: "Malformed",
				_0: "a streamed step was not a JSON object"
			}
		};
	} catch (exn) {
		return {
			TAG: "Error",
			_0: {
				TAG: "Malformed",
				_0: "the streamed event was not valid JSON"
			}
		};
	}
}
function describeFailure(failure) {
	if (typeof failure !== "object") if (failure === "NoJson") return "Your reply contained no JSON object at all.";
	else return "You returned an empty list of steps; the change must be explained in at least one step.";
	else if (failure.TAG === "Malformed") return `The JSON could not be read: ` + failure._0 + `.`;
	else return `You replied with version ` + failure._0.toString() + `; this contract is version ` + 1 .toString() + `.`;
}
function describeDiagnostic(diagnostic) {
	switch (diagnostic.TAG) {
		case "MissingAnchors": return `Step "` + diagnostic.stepId + `" has no anchor; every step must point at least at one file or line range.`;
		case "InvalidLineRange": return `Step "` + diagnostic.stepId + `" has an impossible line range in ` + diagnostic.filePath + `; startLine must be 1 or more and endLine must not be before it.`;
		case "EmptySemanticKey": return `Step "` + diagnostic.stepId + `" has an empty semanticKey.`;
		case "FlowUnknownStep": return `Flow node "` + diagnostic.nodeId + `" has "step": "` + diagnostic.step + `", but no step has that semanticKey; use an existing step's semanticKey or null.`;
		case "FlowUnknownNode": return `A flow edge refers to node "` + diagnostic.nodeId + `", which is not in the flow's "nodes".`;
	}
}
function reviewFrom(steps, goalOpt, generatedByIconOpt, flowOpt, projectId, cwd, base, headCommit) {
	let goal = goalOpt !== void 0 ? valFromOption(goalOpt) : void 0;
	let generatedByIcon = generatedByIconOpt !== void 0 ? valFromOption(generatedByIconOpt) : void 0;
	let flow = flowOpt !== void 0 ? valFromOption(flowOpt) : void 0;
	return Codec.decode({
		id: `review-` + headCommit,
		projectId,
		cwd,
		baseCommit: base,
		headCommit,
		goal,
		steps,
		questions: [],
		generatedByIcon,
		flow
	});
}
var nothingStreamed = {
	goal: void 0,
	flow: void 0,
	steps: [],
	problems: [],
	seen: []
};
function acceptStreamLine(streamed, line, diagnose) {
	let trimmed = line.trim();
	if (trimmed === "" || trimmed.startsWith("```") || streamed.seen.includes(trimmed)) return streamed;
	let seen = streamed.seen.concat([trimmed]);
	let match = decodeStreamGoal(trimmed);
	let match$1 = decodeStreamFlow(trimmed);
	if (match !== void 0) return {
		goal: match,
		flow: streamed.flow,
		steps: streamed.steps,
		problems: streamed.problems,
		seen
	};
	if (match$1 !== void 0) return {
		goal: streamed.goal,
		flow: match$1,
		steps: streamed.steps,
		problems: streamed.problems,
		seen
	};
	if (isStreamComplete(trimmed)) return streamed;
	let failure = decodeStreamStep(trimmed, streamed.steps.length);
	if (failure.TAG !== "Ok") return {
		goal: streamed.goal,
		flow: streamed.flow,
		steps: streamed.steps,
		problems: streamed.problems.concat([describeFailure(failure._0)]),
		seen
	};
	let step = failure._0;
	let problems = diagnose(step);
	if (problems.length !== 0) return {
		goal: streamed.goal,
		flow: streamed.flow,
		steps: streamed.steps,
		problems: streamed.problems.concat(problems),
		seen
	};
	else return {
		goal: streamed.goal,
		flow: streamed.flow,
		steps: streamed.steps.concat([step]),
		problems: streamed.problems,
		seen
	};
}
//#endregion
//#region ../../packages/infrastructure/src/ReviewGuideExport.res.mjs
function longestBacktickRun(s) {
	let longest = 0;
	let current = 0;
	for (let i = 0, i_finish = s.length; i < i_finish; ++i) {
		current = s.charAt(i) === "`" ? current + 1 | 0 : 0;
		if (current > longest) longest = current;
	}
	return longest;
}
function fenceFor(content) {
	let needed = longestBacktickRun(content) + 1 | 0;
	return "`".repeat(needed > 3 ? needed : 3);
}
function renderReviewCloselySection(steps) {
	let flagged = steps.filter((s) => s.risks.length !== 0);
	if (flagged.length === 0) return "";
	return `## Review closely

` + flagged.map((step) => {
		let anchor = step.anchors[0];
		let location = anchor !== void 0 ? ` (` + anchor.filePath + `)` : "";
		return `- **` + step.title + `**` + location + `: ` + step.risks.join(" · ");
	}).join("\n") + `

`;
}
function render(review, files, branch, repoUrl) {
	let goal = review.goal;
	let title;
	let exit = 0;
	if (goal !== void 0 && goal.trim() !== "") title = goal;
	else exit = 1;
	if (exit === 1) title = `Review Tour — ` + getOr(branch, review.cwd);
	let understoodCount = review.steps.filter((s) => s.status === "Understood").length;
	let needsReviewCount = review.steps.filter((s) => s.status === "NeedsReview").length;
	let payload = {
		review: Codec.encode(review),
		files,
		branch,
		repoUrl
	};
	let dataJson = JSON.stringify(payload);
	let fence = fenceFor(dataJson);
	let reviewClosely = renderReviewCloselySection(review.steps);
	return `# ` + title + `

` + files.length.toString() + ` file(s) · ` + review.steps.length.toString() + ` step(s) · ` + understoodCount.toString() + ` understood · ` + needsReviewCount.toString() + ` needs review

` + reviewClosely + "> Drag this file into the Review Guide reader for the interactive walkthrough. The block below is machine-readable data, not meant to be read directly.\n\n<!-- monkey-review-guide:v1 -->\n" + fence + `json
` + dataJson + `
` + fence + `
`;
}
//#endregion
//#region ../../packages/infrastructure/src/ReviewGuideCli.res.mjs
var usage = `Usage:
  review-guide.mjs build <steps.jsonl> --base <ref>
  review-guide.mjs serve <REVIEW-GUIDE-file.md> [--no-open]
  review-guide.mjs wait [--timeout <seconds>]
  review-guide.mjs answer <id> <answer-file>`;
function parseArgs(args) {
	let len = args.length;
	if (len >= 5) return "Usage";
	switch (len) {
		case 0: return "Usage";
		case 1: if (args[0] === "wait") return {
			TAG: "Wait",
			timeoutSeconds: void 0
		};
		else return "Usage";
		case 2:
			if (args[0] !== "serve") return "Usage";
			return {
				TAG: "Serve",
				guide: args[1],
				open_: true
			};
		case 3: switch (args[0]) {
			case "answer": return {
				TAG: "Answer",
				id: args[1],
				file: args[2]
			};
			case "serve":
				let guide$1 = args[1];
				if (args[2] === "--no-open") return {
					TAG: "Serve",
					guide: guide$1,
					open_: false
				};
				if (guide$1 !== "--no-open") return "Usage";
				return {
					TAG: "Serve",
					guide: args[2],
					open_: false
				};
			case "wait":
				if (args[1] !== "--timeout") return "Usage";
				let seconds = args[2];
				let seconds$1 = fromString(seconds, void 0);
				if (seconds$1 !== void 0 && seconds$1 > 0) return {
					TAG: "Wait",
					timeoutSeconds: seconds$1
				};
				else return "Usage";
			default: return "Usage";
		}
		case 4:
			if (args[0] !== "build") return "Usage";
			let steps = args[1];
			if (args[2] === "--base") return {
				TAG: "Build",
				steps,
				base: args[3]
			};
			if (steps !== "--base") return "Usage";
			let base$1 = args[2];
			return {
				TAG: "Build",
				steps: args[3],
				base: base$1
			};
	}
}
function embedGuide(html, guideBase64, agentToken) {
	let island = mapOr(agentToken, "", (token) => `<meta name="review-guide-agent" content="` + token + `">`) + (`<script id="monkey-embedded-guide" type="text/plain">` + guideBase64 + `<\/script>`);
	let at = html.lastIndexOf("</body>");
	if (at !== -1) return html.slice(0, at) + island + html.slice(at);
	else return html + island;
}
function assetPath(root, url, sep) {
	let pathname = getOr(url.split("?")[0], "/");
	let decoded;
	try {
		decoded = decodeURIComponent(pathname);
	} catch (exn) {
		return;
	}
	let segments = decoded.split("/").filter((segment) => segment !== "");
	if (segments.some((segment) => segment === ".." ? true : segment.includes("\\"))) return;
	else return (segments.length !== 0 ? concatMany([[root], segments]) : [root, "index.html"]).join(sep);
}
function contentType(extension) {
	switch (extension.toLowerCase()) {
		case ".css": return "text/css; charset=utf-8";
		case ".html": return "text/html; charset=utf-8";
		case ".json": return "application/json; charset=utf-8";
		case ".js":
		case ".mjs": return "text/javascript; charset=utf-8";
		case ".png": return "image/png";
		case ".svg": return "image/svg+xml";
		case ".txt": return "text/plain; charset=utf-8";
		case ".woff2": return "font/woff2";
		default: return "application/octet-stream";
	}
}
function reviewFromLines(lines, projectId, cwd, base, headCommit) {
	let reviewOf = (steps, goalOpt, flowOpt) => {
		let goal = goalOpt !== void 0 ? valFromOption(goalOpt) : void 0;
		let flow = flowOpt !== void 0 ? valFromOption(flowOpt) : void 0;
		return reviewFrom(steps, some(goal), void 0, some(flow), projectId, cwd, base, headCommit);
	};
	let streamed = reduce(lines.split("\n"), nothingStreamed, (streamed, line) => acceptStreamLine(streamed, line, (step) => {
		return validate(reviewOf([step], void 0, void 0)).map(describeDiagnostic);
	}));
	let review = reviewOf(streamed.steps, some(streamed.goal), some(streamed.flow));
	let match = streamed.steps;
	let match$1 = streamed.problems.concat(validate(review).map(describeDiagnostic));
	if (match.length === 0 && match$1.length === 0) return {
		TAG: "Error",
		_0: ["The file holds no review-step line."]
	};
	if (match$1.length !== 0) return {
		TAG: "Error",
		_0: match$1
	};
	else return {
		TAG: "Ok",
		_0: review
	};
}
function encodeEvent(event) {
	let tmp;
	tmp = typeof event !== "object" ? { type: "idle" } : event.TAG === "Ask" ? {
		type: "ask",
		id: event.id,
		prompt: event.prompt
	} : {
		type: "report",
		markdown: event.markdown
	};
	return JSON.stringify(tmp);
}
function stringIn(body, name) {
	let fields;
	try {
		fields = Decode.object(JSON.parse(body));
	} catch (exn) {
		return;
	}
	if (fields !== void 0) return flatMap(fields[name], Decode.string);
}
function describeEvent(encoded) {
	let match = stringIn(encoded, "type");
	let match$1 = stringIn(encoded, "id");
	let match$2 = stringIn(encoded, "prompt");
	let match$3 = stringIn(encoded, "markdown");
	if (match === void 0) return "idle";
	switch (match) {
		case "ask": if (match$1 !== void 0 && match$2 !== void 0) return `question ` + match$1 + `\n\n` + match$2;
		else return "idle";
		case "report": if (match$3 !== void 0) return `review\n\n` + match$3;
		else return "idle";
		default: return "idle";
	}
}
function mayUseAgentLine(headers, token) {
	if (!equal(headers["x-review-guide-token"], token)) return false;
	let host = headers["host"];
	if (host !== void 0) if (host.startsWith("127.0.0.1:")) return true;
	else return host.startsWith("localhost:");
	else return false;
}
var listeningGraceMs = 600 * 1e3;
function fail(lines) {
	lines.forEach((line) => {
		console.error(line);
	});
	process.exit(1);
}
async function checkoutRoot() {
	let out;
	try {
		out = await git(process.cwd(), ["rev-parse", "--show-toplevel"]);
	} catch (exn) {
		return process.cwd();
	}
	if (out.trim() !== "") return out.trim();
	else return process.cwd();
}
async function build(steps, base) {
	let cwd = await checkoutRoot();
	let val;
	let val$1;
	let val$2;
	try {
		val = Nodefs.readFileSync(steps, "utf8");
		val$1 = await headCommit(cwd);
		val$2 = await diffPatch(cwd, base);
	} catch (exn) {
		return fail([`Could not read ` + steps + `.`]);
	}
	if (val$1 === void 0) return fail([cwd + ` is not a git checkout with a commit.`]);
	if (val$2.TAG !== "Ok") return fail([val$2._0]);
	let problems = reviewFromLines(val, Nodepath.basename(cwd), cwd, base, val$1);
	if (problems.TAG !== "Ok") return fail(concatMany([["The steps could not be used. Fix exactly these problems and run again:"], problems._0.map((problem) => `- ` + problem)]));
	let branch = await currentBranch(cwd);
	let repoUrl = map(await githubRepo(cwd), (repo) => `https://github.com/` + repo);
	let file = Nodepath.join(cwd, guideFilename(branch));
	Nodefs.writeFileSync(file, render(problems._0, parsePatch(val$2._0), branch, repoUrl));
	console.log(file);
}
function stateFile() {
	return Nodepath.join(Nodeos.tmpdir(), ".monkey-review-guide-server.json");
}
function readState() {
	let exit = 0;
	let text;
	try {
		text = Nodefs.readFileSync(stateFile(), "utf8");
		exit = 1;
	} catch (exn) {
		return;
	}
	if (exit === 1) {
		let exit$1 = 0;
		let val;
		let val$1;
		try {
			val = stringIn(text, "token");
			val$1 = getOr(Decode.object(JSON.parse(text)), {});
			exit$1 = 2;
		} catch (exn$1) {
			return;
		}
		if (exit$1 === 2) {
			if (val === void 0) return;
			let int = (name) => map(flatMap(val$1[name], Decode.float), (prim) => prim | 0);
			let match = int("pid");
			let match$1 = int("port");
			if (match !== void 0 && match$1 !== void 0) return {
				pid: match,
				port: match$1,
				token: val
			};
			else return;
		}
	}
}
function stopPrevious() {
	let match = readState();
	if (match === void 0) return;
	let pid = match.pid;
	if (pid === process.pid) return;
	try {
		process.kill(pid);
		return;
	} catch (exn) {
		return;
	}
}
function openInBrowser(url) {
	let match = process.platform;
	let match$1;
	switch (match) {
		case "darwin":
			match$1 = ["open", [url]];
			break;
		case "win32":
			match$1 = ["cmd", [
				"/c",
				"start",
				"",
				url
			]];
			break;
		default: match$1 = ["xdg-open", [url]];
	}
	let child = Nodechild_process.spawn(match$1[0], match$1[1], {
		detached: true,
		stdio: "ignore"
	});
	child.on("error", (param) => {});
	child.unref();
}
var json = "application/json; charset=utf-8";
function reply(response, status, body) {
	if (!response.writableEnded) {
		response.writeHead(status, { "content-type": json });
		response.end(body);
		return;
	}
}
function errorBody(message) {
	return JSON.stringify({ error: message });
}
function readBody(request, then) {
	let body = { contents: "" };
	request.setEncoding("utf8");
	request.on("data", (chunk) => {
		if (body.contents.length < 8388608) {
			body.contents = body.contents + chunk;
			return;
		}
	});
	request.on("end", () => then(body.contents));
}
function createServer(root, page, token) {
	let pending = { contents: [] };
	let waiter = { contents: void 0 };
	let asking = {};
	let nextId = { contents: 0 };
	let agentSeenAt = { contents: void 0 };
	let listening = () => {
		if (isSome(waiter.contents)) return true;
		else return mapOr(agentSeenAt.contents, false, (at) => Date.now() - at < listeningGraceMs);
	};
	let notListening = (response) => reply(response, 503, errorBody("The agent is no longer listening. Ask it to open the review guide again."));
	let finishWait = (event) => {
		let match = waiter.contents;
		if (match === void 0) return;
		let response = match[0];
		waiter.contents = void 0;
		match[1]();
		if (!response.writableEnded) {
			response.end(encodeEvent(event));
			return;
		}
	};
	let deliver = () => {
		let match = waiter.contents;
		let match$1 = pending.contents[0];
		if (match !== void 0 && match$1 !== void 0) {
			pending.contents = pending.contents.slice(1);
			return finishWait(match$1);
		}
	};
	return Nodehttp.createServer((request, response) => {
		let path = getOr(request.url.split("?")[0], "/");
		if (path.startsWith("/agent/")) if (mayUseAgentLine(request.headers, token)) {
			switch (request.method) {
				case "GET":
					if (path === "/agent/next") {
						agentSeenAt.contents = Date.now();
						finishWait("Idle");
						response.writeHead(200, { "content-type": json });
						let beat = setInterval(() => {
							response.write(" ");
						}, 2e4);
						let timeout = map(flatMap(request.url.split("timeout=")[1], (seconds) => fromString(seconds, void 0)), (seconds) => setTimeout(() => finishWait("Idle"), seconds * 1e3 | 0));
						waiter.contents = [response, () => {
							clearInterval(beat);
							forEach(timeout, (prim) => {
								clearTimeout(prim);
							});
							agentSeenAt.contents = Date.now();
						}];
						response.on("close", () => {
							let match = waiter.contents;
							if (match !== void 0 && match[0] === response) {
								waiter.contents = void 0;
								return match[1]();
							}
						});
						return deliver();
					}
					break;
				case "POST":
					switch (path) {
						case "/agent/answer":
							agentSeenAt.contents = Date.now();
							return readBody(request, (body) => {
								let match = stringIn(body, "id");
								let match$1 = stringIn(body, "answer");
								if (match !== void 0 && match$1 !== void 0) {
									forEach(asking[match], (page) => reply(page, 200, JSON.stringify({ answer: match$1 })));
									$$delete$1(asking, match);
									return reply(response, 200, "{}");
								} else return reply(response, 400, errorBody("Expected an id and an answer."));
							});
						case "/agent/ask": return readBody(request, (body) => {
							let prompt = stringIn(body, "prompt");
							if (prompt === void 0) return reply(response, 400, errorBody("Expected a prompt."));
							if (!listening()) return notListening(response);
							nextId.contents = nextId.contents + 1 | 0;
							let id = nextId.contents.toString();
							asking[id] = response;
							response.on("close", () => $$delete$1(asking, id));
							pending.contents = pending.contents.concat([{
								TAG: "Ask",
								id,
								prompt
							}]);
							deliver();
						});
						case "/agent/report": return readBody(request, (body) => {
							let markdown = stringIn(body, "markdown");
							if (markdown !== void 0) if (listening()) {
								pending.contents = pending.contents.concat([{
									TAG: "Report",
									markdown
								}]);
								deliver();
								return reply(response, 200, "{}");
							} else return notListening(response);
							else return reply(response, 400, errorBody("Expected the review notes."));
						});
					}
					break;
			}
			return reply(response, 404, errorBody("Not found"));
		} else return reply(response, 403, errorBody("Forbidden"));
		let file = assetPath(root, request.url, Nodepath.sep);
		if (file !== void 0) {
			if (Nodepath.basename(file) === "index.html" && Nodepath.dirname(file) === root) {
				response.writeHead(200, { "content-type": contentType(".html") });
				response.end(page);
				return;
			}
			if (Nodefs.existsSync(file) && Nodefs.statSync(file).isFile()) {
				response.writeHead(200, { "content-type": contentType(Nodepath.extname(file)) });
				response.end(Nodefs.readFileSync(file));
				return;
			}
		}
		response.writeHead(404, { "content-type": contentType(".txt") });
		response.end("Not found");
	});
}
function serve(guide, open_) {
	let root = Nodepath.join(Nodepath.dirname(Nodeurl.fileURLToPath(import.meta.url)), "reader");
	let val;
	let val$1;
	try {
		val = Nodefs.readFileSync(guide, "utf8");
		val$1 = Nodefs.readFileSync(Nodepath.join(root, "index.html"), "utf8");
	} catch (exn) {
		return fail([`Could not read ` + guide + ` or the reader in ` + root + `.`]);
	}
	let token = Nodecrypto.randomUUID();
	let server = createServer(root, embedGuide(val$1, Buffer.from(val).toString("base64"), token), token);
	stopPrevious();
	server.listen(0, "127.0.0.1", () => {
		let port = server.address().port;
		Nodefs.writeFileSync(stateFile(), JSON.stringify({
			pid: process.pid,
			port,
			token
		}), { mode: 384 });
		let url = `http://127.0.0.1:` + port.toString() + `/`;
		console.log(url);
		if (open_) return openInBrowser(url);
	});
}
async function agentRequest(path, method, body) {
	let match = readState();
	if (match === void 0) return {
		TAG: "Error",
		_0: "No review guide is being served. Run `serve` first."
	};
	let response;
	try {
		response = await fetch(`http://127.0.0.1:` + match.port.toString() + path, {
			method,
			headers: {
				"x-review-guide-token": match.token,
				"content-type": json
			},
			body
		});
	} catch (exn) {
		return {
			TAG: "Error",
			_0: "The review guide server is not running any more."
		};
	}
	let text = (await response.text()).trim();
	if (response.status === 200) return {
		TAG: "Ok",
		_0: text
	};
	else return {
		TAG: "Error",
		_0: getOr(stringIn(text, "error"), text)
	};
}
async function wait(timeoutSeconds) {
	let event = await agentRequest("/agent/next" + mapOr(timeoutSeconds, "", (seconds) => `?timeout=` + seconds.toString()), "GET", void 0);
	if (event.TAG !== "Ok") return fail([event._0]);
	console.log(describeEvent(event._0));
}
async function answer(id, file) {
	let text;
	try {
		text = Nodefs.readFileSync(file, "utf8");
	} catch (exn) {
		return fail([`Could not read ` + file + `.`]);
	}
	let message = await agentRequest("/agent/answer", "POST", JSON.stringify({
		id,
		answer: text.trim()
	}));
	if (message.TAG === "Ok") return await wait(void 0);
	else return fail([message._0]);
}
async function main() {
	let match = parseArgs(process.argv.slice(2));
	if (typeof match !== "object") return fail([usage]);
	switch (match.TAG) {
		case "Build": return await build(match.steps, match.base);
		case "Serve": return serve(match.guide, match.open_);
		case "Wait": return await wait(match.timeoutSeconds);
		case "Answer": return await answer(match.id, match.file);
	}
}
//#endregion
//#region src/review-guide-cli.mjs
main();
//#endregion
export {};
