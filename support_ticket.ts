export type TicketType = "technical" | "billing" | "general";
export type Priority = "low" | "medium" | "high";
export type Status = "open" | "in_progress" | "resolved";

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

export interface CreateTicketInput {
    id: string;
    priority: Priority;
    customer: Customer;
    description: string;
}

export interface Agent {
    id: string;
    name: string;
    skill: TicketType;
    seniority: "junior" | "senior";
}

export interface TicketObserver {
    update(ticket: Ticket): void;
}
const formatStatus = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
} as const;

export class EmailNotifier implements TicketObserver {
    update(ticket: Ticket): void {
        console.log(
            `[EMAIL → ${ticket.customer.email}] Your ticket #${ticket.id} status changed to ${formatStatus[ticket.status]}`
        );
    }
}

export class SmsNotifier implements TicketObserver {
    update(ticket: Ticket): void {
        const phone = ticket.customer.phone ?? "unknown";
        console.log(
            `[SMS → ${phone}] Your ticket #${ticket.id} status changed to ${formatStatus[ticket.status]}`
        );
    }
}

export class ConsoleNotifier implements TicketObserver {
    update(ticket: Ticket): void {
        console.log(
            `[CONSOLE] Your ticket #${ticket.id} status changed to ${formatStatus[ticket.status]}`
        );
    }
}

const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
    open: ["in_progress"],
    in_progress: ["resolved"],
    resolved: [],
};


export abstract class Ticket {
    readonly id: string;
    readonly priority: Priority;
    readonly customer: Customer;
    readonly description: string;
    abstract readonly type: TicketType;

    private _status: Status = "open";
    private observers: TicketObserver[] = [];
    assignedAgent: Agent | null = null;

    constructor(input: CreateTicketInput) {
        this.id = input.id;
        this.priority = input.priority;
        this.customer = input.customer;
        this.description = input.description;
    }

    get status(): Status {
        return this._status;
    }

    attach(observer: TicketObserver): void {
        this.observers.push(observer);
    }

    detach(observer: TicketObserver): void {
        this.observers = this.observers.filter((o) => o !== observer);
    }

    setStatus(next: Status): void {
        const allowed = ALLOWED_TRANSITIONS[this._status];
        if (!allowed.includes(next)) {
            throw new Error(
                `Invalid transition: ${this._status} → ${next} (ticket #${this.id})`
            );
        }
        this._status = next;
        this.notify();
    }

    private notify(): void {
        for (const observer of this.observers) {
            observer.update(this);
        }
    }

    summary(): string {
        const agent = this.assignedAgent?.name ?? "unassigned";
        return `#${this.id} [${this.type}/${this.priority}] ${this._status} → ${agent}: ${this.description}`;
    }
}

export class TechnicalTicket extends Ticket {
    readonly type: TicketType = "technical";
}

export class BillingTicket extends Ticket {
    readonly type: TicketType = "billing";
}

export class GeneralTicket extends Ticket {
    readonly type: TicketType = "general";
}

const TicketTypes = {
    technical: TechnicalTicket,
    billing: BillingTicket,
    general: GeneralTicket,
}
export class TicketFactory {
    static create(type: TicketType, input: CreateTicketInput): Ticket {
        return new TicketTypes[type](input);
    }
}

export interface AssignmentStrategy {
    assign(ticket: Ticket, agents: Agent[]): Agent;
}

export class RoundRobinAssignment implements AssignmentStrategy {
    private index = 0;

    assign(_ticket: Ticket, agents: Agent[]): Agent {
        if (agents.length === 0) {
            throw new Error("No agents available for assignment.");
        }
        const agent = agents[this.index % agents.length];
        this.index += 1;
        return agent;
    }
}

export class PriorityAssignment implements AssignmentStrategy {
    assign(ticket: Ticket, agents: Agent[]): Agent {
        if (agents.length === 0) {
            throw new Error("No agents available for assignment.");
        }

        const skilled = agents.filter((a) => a.skill === ticket.type);
        const pool = skilled.length > 0 ? skilled : agents;

        if (ticket.priority === "high") {
            return pool.find((a) => a.seniority === "senior") ?? pool[0];
        }
        return pool.find((a) => a.seniority === "junior") ?? pool[0];
    }
}


export class TicketService {
    private tickets: Ticket[] = [];
    private defaultObservers: TicketObserver[];

    constructor(
        private agents: Agent[],
        private assignment: AssignmentStrategy,
        defaultObservers: TicketObserver[] = []
    ) {
        this.defaultObservers = defaultObservers;
    }

    setAssignment(strategy: AssignmentStrategy): void {
        this.assignment = strategy;
    }

    createTicket(type: TicketType, input: CreateTicketInput): Ticket {
        const ticket = TicketFactory.create(type, input);

        for (const observer of this.defaultObservers) {
            ticket.attach(observer);
        }

        ticket.assignedAgent = this.assignment.assign(ticket, this.agents);
        this.tickets.push(ticket);
        console.log(`[CREATED] ${ticket.summary()}`);
        return ticket;
    }

    getTicket(id: string): Ticket | undefined {
        return this.tickets.find((t) => t.id === id);
    }

    listTickets(): Ticket[] {
        return [...this.tickets];
    }
}


function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`  ✓ ${message}`);
}

function runTests(): void {
    console.log("\n=== Test: Ticket creation ===");
    const customer: Customer = {
        id: "c1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+1-555-0100",
    };

    const technical = TicketFactory.create("technical", {
        id: "101",
        priority: "high",
        customer,
        description: "API returns 500 on checkout",
    });
    const billing = TicketFactory.create("billing", {
        id: "102",
        priority: "medium",
        customer,
        description: "Double charged last invoice",
    });
    const general = TicketFactory.create("general", {
        id: "103",
        priority: "low",
        customer,
        description: "How do I reset my password?",
    });

    assert(technical.type === "technical", "creates Technical ticket");
    assert(billing.type === "billing", "creates Billing ticket");
    assert(general.type === "general", "creates General Inquiry ticket");
    assert(technical.status === "open", "new tickets start as Open");

    console.log("\n=== Test: Status change + notification delivery ===");
    technical.attach(new ConsoleNotifier());
    technical.attach(new EmailNotifier());
    technical.attach(new SmsNotifier());

    technical.setStatus("in_progress");
    assert(technical.status === "in_progress", "moved to In Progress");

    technical.setStatus("resolved");
    assert(technical.status === "resolved", "moved to Resolved");

    let threw = false;
    try {
        technical.setStatus("open");
    } catch {
        threw = true;
    }
    assert(threw, "rejects invalid status transition");

    console.log("\n=== Test: Assignment strategies ===");
    const agents: Agent[] = [
        { id: "a1", name: "Sam", skill: "technical", seniority: "junior" },
        { id: "a2", name: "Riley", skill: "billing", seniority: "senior" },
        { id: "a3", name: "Jordan", skill: "technical", seniority: "senior" },
    ];

    const service = new TicketService(agents, new PriorityAssignment(), [
        new ConsoleNotifier(),
        new EmailNotifier(),
    ]);

    const highTech = service.createTicket("technical", {
        id: "201",
        priority: "high",
        customer,
        description: "Production outage",
    });
    assert(
        highTech.assignedAgent?.name === "Jordan",
        "high-priority technical → senior technical agent"
    );

    service.setAssignment(new RoundRobinAssignment());
    const t1 = service.createTicket("general", {
        id: "202",
        priority: "low",
        customer,
        description: "Feature question",
    });
    const t2 = service.createTicket("general", {
        id: "203",
        priority: "low",
        customer,
        description: "Account question",
    });
    assert(t1.assignedAgent !== null && t2.assignedAgent !== null, "round-robin assigns agents");
    assert(t1.assignedAgent?.id !== t2.assignedAgent?.id, "round-robin rotates agents");

    highTech.setStatus("in_progress");
    highTech.setStatus("resolved");

    console.log("\nAll tests passed.\n");
}

runTests();
