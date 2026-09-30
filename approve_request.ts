class ApproveRequest {
    nextApprover: ApproveRequest | null = null;
    minApprovalAmount: number = 0;
    name = '';
    constructor(minApprovalAmount: number, name: string) {
        this.nextApprover = null;
        this.minApprovalAmount = minApprovalAmount;
        this.name = name;
    }

    setNext(nextApprover: ApproveRequest) {
        this.nextApprover = nextApprover;
        return nextApprover;
    }

    approve(amount: number): boolean {
        if(!this.nextApprover || this.nextApprover.minApprovalAmount > this.minApprovalAmount) {
            console.log(`${this.name} approved the request of ${amount}`);
            return true;
        }else {
            return this.nextApprover.approve(amount);
        }
    }
}


const director = new ApproveRequest(1000, 'Team Lead');
director.setNext(new ApproveRequest(5000, 'Manager')).setNext(new ApproveRequest(20000, 'Director'));
