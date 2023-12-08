export type AutosuggestInputProps = {
    inputs: string[];
    selectedInputs: string[];
    setSelectedInputs: (inputs: string[]) => void;
    placeholder?: string;
    isSingleInput?: boolean;
    classes?: string | string[];
}