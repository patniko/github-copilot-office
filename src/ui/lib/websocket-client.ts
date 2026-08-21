/*---------------------------------------------------------------------------------------------
 *  WebSocket-based CopilotClient for browser environments
 *  Custom client that connects to the Copilot CLI via WebSocket proxy
 *--------------------------------------------------------------------------------------------*/

import { createMessageConnection, MessageConnection } from "vscode-jsonrpc";
import { WebSocketMessageReader, WebSocketMessageWriter } from "./websocket-transport";
import type {
    SessionConfig,
    SessionEvent,
    SessionEventHandler,
    MessageOptions,
    Tool,
    ToolHandler,
    ToolInvocation,
    ToolResultObject,
} from "@github/copilot-sdk";

/** Protocol version implemented by this client. Must match the runtime's `connect` reply. */
const SDK_PROTOCOL_VERSION = 3;
const MIN_SDK_PROTOCOL_VERSION = 3;

/** Payload of the `external_tool.requested` session event (protocol v3). */
interface ExternalToolRequestedData {
    requestId: string;
    sessionId: string;
    toolCallId: string;
    toolName: string;
    arguments?: unknown;
}

/** Payload of the `permission.requested` session event (protocol v3). */
interface PermissionRequestedData {
    requestId: string;
    permissionRequest: PermissionRequest;
    resolvedByHook?: boolean;
}

export interface PermissionRequest {
    kind: "shell" | "write" | "read" | "mcp";
    toolCallId?: string;
    intention?: string;
    // shell
    fullCommandText?: string;
    commands?: ReadonlyArray<{ identifier: string }>;
    // write
    fileName?: string;
    diff?: string;
    // read
    path?: string;
    // mcp
    serverName?: string;
    toolName?: string;
    args?: unknown;
}

export type PermissionResult =
    | { kind: "approved" }
    | { kind: "denied-interactively-by-user" };

export type PermissionHandler = (request: PermissionRequest) => Promise<PermissionResult>;

export interface ModelInfo {
    id: string;
    name: string;
    capabilities?: {
        supports?: {
            vision?: boolean;
            reasoningEffort?: boolean;
        };
    };
}

export interface CreateSessionOptions extends SessionConfig {
    requestPermission?: boolean;
    workingDirectory?: string;
    availableTools?: string[];
}

/**
 * Browser-compatible CopilotSession
 */
export class BrowserCopilotSession {
    private eventHandlers: Set<SessionEventHandler> = new Set();
    private toolHandlers: Map<string, ToolHandler> = new Map();
    private permissionHandler: PermissionHandler | null = null;

    constructor(
        public readonly sessionId: string,
        private connection: MessageConnection,
    ) {}

    async send(options: MessageOptions): Promise<string> {
        const response = await this.connection.sendRequest("session.send", {
            sessionId: this.sessionId,
            prompt: options.prompt,
            attachments: options.attachments,
            mode: options.mode,
        });
        return (response as { messageId: string }).messageId;
    }

    /**
     * Send a prompt and iterate over response events.
     */
    async *query(options: MessageOptions): AsyncGenerator<SessionEvent, void, undefined> {
        const queue: SessionEvent[] = [];
        let resolve: (() => void) | null = null;
        let done = false;
        let sendError: Error | null = null;

        const unsubscribe = this.on((event) => {
            queue.push(event);
            resolve?.();
            if (event.type === "session.idle" || event.type === "session.error") {
                done = true;
            }
        });

        this.send(options).catch((e) => { 
            sendError = e instanceof Error ? e : new Error(String(e));
            done = true; 
            resolve?.();
        });

        try {
            while (!done || queue.length > 0) {
                if (queue.length > 0) {
                    yield queue.shift()!;
                } else {
                    await new Promise<void>((r) => { resolve = r; });
                    resolve = null;
                }
            }
            if (sendError) {
                throw sendError;
            }
        } finally {
            unsubscribe();
        }
    }

    on(handler: SessionEventHandler): () => void {
        this.eventHandlers.add(handler);
        return () => { this.eventHandlers.delete(handler); };
    }

    _dispatchEvent(event: SessionEvent): void {
        // Protocol v3 delivers tool invocations and permission prompts as session
        // events that the client answers with a follow-up RPC, rather than as
        // server-to-client JSON-RPC requests.
        this._handleBroadcastEvent(event);

        for (const handler of this.eventHandlers) {
            try { handler(event); } catch { /* ignore */ }
        }
    }

    /** Routes protocol-v3 broadcast events to locally registered handlers. */
    private _handleBroadcastEvent(event: SessionEvent): void {
        if (event.type === "external_tool.requested") {
            const data = (event as unknown as { data: ExternalToolRequestedData }).data;
            void this._executeToolAndRespond(data);
        } else if (event.type === "permission.requested") {
            const data = (event as unknown as { data: PermissionRequestedData }).data;
            if (data.resolvedByHook) return;
            void this._executePermissionAndRespond(data);
        }
    }

    private async _executeToolAndRespond(data: ExternalToolRequestedData): Promise<void> {
        const { requestId, toolCallId, toolName } = data;
        const args = data.arguments;
        const handler = this.toolHandlers.get(toolName);

        if (!handler) {
            console.log("[external_tool.requested] no handler for", toolName);
            await this._respondToTool(requestId, undefined, `Tool '${toolName}' not supported`);
            return;
        }

        try {
            const invocation: ToolInvocation = {
                sessionId: this.sessionId,
                toolCallId,
                toolName,
                arguments: args,
            };
            const rawResult = await handler(args, invocation);
            const result: string | ToolResultObject =
                rawResult == null
                    ? ""
                    : typeof rawResult === "string"
                      ? rawResult
                      : this._isToolResultObject(rawResult)
                        ? rawResult
                        : JSON.stringify(rawResult);
            await this._respondToTool(requestId, result);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.log("[external_tool.requested] error", error);
            await this._respondToTool(requestId, undefined, message);
        }
    }

    private _isToolResultObject(value: unknown): value is ToolResultObject {
        return (
            typeof value === "object" &&
            value !== null &&
            typeof (value as ToolResultObject).textResultForLlm === "string"
        );
    }

    private async _respondToTool(
        requestId: string,
        result?: string | ToolResultObject,
        error?: string,
    ): Promise<void> {
        try {
            await this.connection.sendRequest("session.tools.handlePendingToolCall", {
                sessionId: this.sessionId,
                requestId,
                ...(error !== undefined ? { error } : { result }),
            });
        } catch (e) {
            console.error("[external_tool.requested] failed to deliver result", e);
        }
    }

    private async _executePermissionAndRespond(data: PermissionRequestedData): Promise<void> {
        let result: PermissionResult;
        try {
            result = await this._handlePermissionRequest(data.permissionRequest);
        } catch {
            result = { kind: "denied-interactively-by-user" };
        }
        try {
            await this.connection.sendRequest(
                "session.permissions.handlePendingPermissionRequest",
                { sessionId: this.sessionId, requestId: data.requestId, result },
            );
        } catch (e) {
            console.error("[permission.requested] failed to deliver decision", e);
        }
    }

    registerTools(tools?: Tool[]): void {
        this.toolHandlers.clear();
        if (tools) {
            for (const tool of tools) {
                // `handler` is optional in the SDK type; only locally-executed tools have one.
                if (tool.handler) {
                    this.toolHandlers.set(tool.name, tool.handler);
                }
            }
        }
    }

    registerPermissionHandler(handler: PermissionHandler): void {
        this.permissionHandler = handler;
    }

    getToolHandler(name: string): ToolHandler | undefined {
        return this.toolHandlers.get(name);
    }

    async _handlePermissionRequest(request: PermissionRequest): Promise<PermissionResult> {
        if (this.permissionHandler) {
            return this.permissionHandler(request);
        }
        return { kind: "denied-interactively-by-user" };
    }

    async getMessages(): Promise<SessionEvent[]> {
        const response = await this.connection.sendRequest("session.getMessages", {
            sessionId: this.sessionId,
        });
        return (response as { events: SessionEvent[] }).events;
    }

    async destroy(): Promise<void> {
        await this.connection.sendRequest("session.destroy", {
            sessionId: this.sessionId,
        });
        this.eventHandlers.clear();
        this.toolHandlers.clear();
    }
}

/**
 * Browser-compatible CopilotClient connected via WebSocket
 */
export class WebSocketCopilotClient {
    private connection: MessageConnection | null = null;
    private wsSocket: WebSocket | null = null;
    private sessions: Map<string, BrowserCopilotSession> = new Map();
    private negotiatedProtocolVersion: number | null = null;

    constructor(private url: string) {}

    async start(): Promise<void> {
        if (this.connection) return;

        await new Promise<void>((resolve, reject) => {
            this.wsSocket = new WebSocket(this.url);

            this.wsSocket.addEventListener("open", () => {
                const reader = new WebSocketMessageReader(this.wsSocket!);
                const writer = new WebSocketMessageWriter(this.wsSocket!);
                this.connection = createMessageConnection(reader, writer);
                this.attachConnectionHandlers();
                this.connection.listen();
                resolve();
            });

            this.wsSocket.addEventListener("error", () => {
                reject(new Error(`Failed to connect to ${this.url}`));
            });
        });

        await this.verifyProtocolVersion();
    }

    /**
     * Performs the `connect` handshake and checks that the runtime speaks a
     * protocol version this client understands.
     */
    private async verifyProtocolVersion(): Promise<void> {
        if (!this.connection) throw new Error("Client not connected");

        const response = await this.connection.sendRequest("connect", {});
        const serverVersion = (response as { protocolVersion?: number }).protocolVersion;

        if (serverVersion === undefined) {
            throw new Error(
                "Copilot runtime did not report a protocol version. Update the Copilot CLI.",
            );
        }
        if (serverVersion < MIN_SDK_PROTOCOL_VERSION || serverVersion > SDK_PROTOCOL_VERSION) {
            throw new Error(
                `Copilot protocol version mismatch: this client supports ` +
                `${MIN_SDK_PROTOCOL_VERSION}-${SDK_PROTOCOL_VERSION}, but the runtime reports ` +
                `${serverVersion}. Update the Copilot CLI or this add-in.`,
            );
        }
        this.negotiatedProtocolVersion = serverVersion;
    }

    async createSession(config: CreateSessionOptions = {}): Promise<BrowserCopilotSession> {
        if (!this.connection) {
            throw new Error("Client not connected. Call start() first.");
        }

        const toolDefs = config.tools?.map((tool) => ({
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
                overridesBuiltInTool: tool.overridesBuiltInTool,
                skipPermission: tool.skipPermission,
                defer: tool.defer,
                metadata: tool.metadata,
            }));

        const response = await this.connection.sendRequest("session.create", {
            model: config.model,
            sessionId: config.sessionId,
            systemMessage: config.systemMessage,
            requestPermission: config.requestPermission ?? false,
            workingDirectory: config.workingDirectory,
            streaming: true,
            availableTools: config.availableTools,
            tools: toolDefs,
        });

        const sessionId = (response as { sessionId: string }).sessionId;
        const session = new BrowserCopilotSession(sessionId, this.connection);
        session.registerTools(config.tools);
        this.sessions.set(sessionId, session);
        return session;
    }

    async listModels(): Promise<ModelInfo[]> {
        if (!this.connection) {
            throw new Error("Client not connected. Call start() first.");
        }
        const result = await this.connection.sendRequest("models.list", {});
        return (result as { models: ModelInfo[] }).models;
    }

    async stop(): Promise<void> {
        for (const session of this.sessions.values()) {
            try { await session.destroy(); } catch { /* ignore */ }
        }
        this.sessions.clear();

        if (this.connection) {
            this.connection.dispose();
            this.connection = null;
        }

        if (this.wsSocket) {
            this.wsSocket.close();
            this.wsSocket = null;
        }
    }

    private attachConnectionHandlers(): void {
        if (!this.connection) return;

        this.connection.onNotification("session.event", (notification: unknown) => {
            const n = notification as { sessionId?: string; event?: SessionEvent };
            if (n.sessionId && n.event) {
                this.sessions.get(n.sessionId)?._dispatchEvent(n.event);
            }
        });
    }
}

/**
 * Creates a CopilotClient connected via WebSocket.
 */
export async function createWebSocketClient(url: string): Promise<WebSocketCopilotClient> {
    const client = new WebSocketCopilotClient(url);
    await client.start();
    return client;
}
