import nodemailer, { Transporter, SendMailOptions, SentMessageInfo } from "nodemailer";


interface EmailServiceInterface {
    sendEmail(to: string, subject: string, text: string): Promise<void>;
}

enum EmailType {
    TRANSACTIONAL = 'transactional',
    NON_TRANSACTIONAL = 'non_transactional',
    SUBSCRIPTION = 'subscription',
}

class EmailService {
    private transporter: Transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async baseSendEmail(to: string, from: string, subject: string, text: string) {
        const mailOptions: SendMailOptions = {
            from,
            to,
            subject,
            text,
        };
        await this.transporter.sendMail(mailOptions);
    }
}

 class transactionalEmails extends EmailService implements EmailServiceInterface {
    constructor() {
        super();
    }

    async sendEmail(to: string, subject: string, text: string) {
        this.baseSendEmail(to, process.env.EMAIL_TRANSACTIONAL_USER || '', subject, text);
    }
}


 class nonTransactionalEmails extends EmailService implements EmailServiceInterface {
    constructor() {
        super();
    }

    async sendEmail(to: string, subject: string, text: string) {
        this.baseSendEmail(to, process.env.EMAIL_TRANSACTIONAL_USER || '', subject, text);
    }
}

class SubscriptionEmails extends EmailService implements EmailServiceInterface {
    constructor() {
        super();
    }

    async sendEmail(to: string, subject: string, text: string) {
        this.baseSendEmail(to, process.env.EMAIL_TRANSACTIONAL_USER || '', subject, text);
    }
}

export const emailObjectMap = {
    [EmailType.TRANSACTIONAL]:new  transactionalEmails(),
    [EmailType.NON_TRANSACTIONAL]:new nonTransactionalEmails(),
    [EmailType.SUBSCRIPTION]:new SubscriptionEmails(),
}

emailObjectMap[EmailType.TRANSACTIONAL].sendEmail('test@test.com', 'Test Subject', 'Test Body');



/**
 * Which design pattern(s) you used in this project?
 * 
 * 1. Factory Pattern: Used to create the email object map.
 * 2. Singleton Pattern: Used to create the email service.
 * 3. Strategy Pattern: Used to create the email Class.
 * 
 * 
 * 
 * Good points (pros)
 * Swap behavior easily — pick transactional vs subscription email without changing the caller.
 * Open/Closed — add a new strategy (e.g. marketing emails) without editing existing ones.
 * Cleaner than big if/else or switch — each variant lives in its own class.
 * Testable — mock or unit-test one strategy in isolation.
 * Clear intent — “which algorithm/behavior?” is explicit via the interface.
 * 
 * Drawbacks (cons)
 * More classes — one interface + several implementations (like your 3 email classes) can feel heavy for small differences.
 * Caller must know strategies — something still chooses which one (your emailObjectMap / EmailType).
 * Duplication risk — if strategies are almost the same (as in your file — same from env var), you get boilerplate without real variation.
 * Harder to follow for beginners — logic is split across files/classes instead of one place.
 * Overkill for 1–2 variants — a simple conditional can be clearer until the set of behaviors grows.
 */