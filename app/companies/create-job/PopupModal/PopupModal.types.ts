export type AddFundsModalProps = {
    jobId: number;
    open: boolean;
    type: string;
    onClose: VoidFunction;
    onSubmit: (amount: number, type: string) => void;
    currencyToken: string;
};