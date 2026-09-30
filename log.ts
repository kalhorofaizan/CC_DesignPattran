export enum LogLevel {
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

export interface LogMessage {
    level: LogLevel;
    message: string;
    timestamp: Date;
}

export abstract class BaseLogSink {
    protected allowedLevels: LogLevel[];

    constructor(allowedLevels: LogLevel[]) {
        this.allowedLevels = allowedLevels;
    }

    public log(message: LogMessage): void {
        if (this.allowedLevels.includes(message.level)) {
            this.write(message);
        }
    }
    protected abstract write(message: LogMessage): void;
}

export class ConsoleLogSink extends BaseLogSink {
    protected write(message: LogMessage): void {
        const formatted = `[CONSOLE] [${LogLevel[message.level]}] [${message.timestamp.toISOString()}]: ${message.message}`;
        console.log(formatted);
    }
}

export class FileLogSink extends BaseLogSink {
    private filePath: string;

    constructor(allowedLevels: LogLevel[], filePath: string = "app.log") {
        super(allowedLevels);
        this.filePath = filePath;
    }

    protected write(message: LogMessage): void {
        const formatted = `[FILE: ${this.filePath}] [${LogLevel[message.level]}] [${message.timestamp.toISOString()}]: ${message.message}`;
        console.log(formatted); 
    }
}

export class DatabaseLogSink extends BaseLogSink {
    private connectionString: string;

    constructor(allowedLevels: LogLevel[], connectionString: string) {
        super(allowedLevels);
        this.connectionString = connectionString;
    }

    protected write(message: LogMessage): void {
        const formatted = `[DB: ${this.connectionString}] [${LogLevel[message.level]}] [${message.timestamp.toISOString()}]: ${message.message}`;
        console.log(formatted); 
    }
}

export class LoggerManager {
    private sinks: BaseLogSink[] = [];

    public registerSink(sink: BaseLogSink): void {
        this.sinks.push(sink);
    }

    public log(level: LogLevel, message: string): void {
        const logMsg: LogMessage = {
            level,
            message,
            timestamp: new Date(),
        };

        for (const sink of this.sinks) {
            sink.log(logMsg);
        }
    }
}

export type SinkType = "console" | "file" | "database";

export interface SinkConfig {
    type: SinkType;
    allowedLevels: LogLevel[];
    options?: {
        filePath?: string;
        connectionString?: string;
    };
}

export class LogSinkFactory {
    public static createSink(config: SinkConfig): BaseLogSink {
        switch (config.type) {
            case "console":
                return new ConsoleLogSink(config.allowedLevels);
            case "file":
                return new FileLogSink(
                    config.allowedLevels,
                    config.options?.filePath ?? "app.log"
                );
            case "database":
                if (!config.options?.connectionString) {
                    throw new Error("Database sink requires a connection string.");
                }
                return new DatabaseLogSink(
                    config.allowedLevels,
                    config.options.connectionString
                );
            default:
                throw new Error(`Unsupported sink type: ${config.type}`);
        }
    }
}

const sinkConfigs: SinkConfig[] = [
    {
        type: "console",
        allowedLevels: [LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR],
    },
    {
        type: "file",
        allowedLevels: [LogLevel.WARN, LogLevel.ERROR],
        options: { filePath: "/var/logs/system.log" },
    },
    {
        type: "database",
        allowedLevels: [LogLevel.ERROR],
        options: { connectionString: "postgres://user:pass@localhost:5432/logs" },
    },
];

const logger = new LoggerManager();
sinkConfigs.forEach((config) => {
    logger.registerSink(LogSinkFactory.createSink(config));
});


logger.log(LogLevel.INFO, "Application successfully booted.");

logger.log(LogLevel.WARN, "Memory usage exceeded 85%.");

logger.log(LogLevel.ERROR, "Unhandled exception: Database connection dropped.");