import { Player, RawMessage } from "@minecraft/server";
import { FormCancelationReason, FormRejectReason, FormResponse, ModalFormResponse } from "@minecraft/server-ui";
interface Showable<T> {
    show(player: Player): Promise<T>;
}
type ScriptDialogueString = string | RawMessage;
interface OptionalShowDialogueOptions {
    lockPlayerCamera: boolean;
    busyRetriesCount: number;
    busyRetriesTick: number;
}
interface RequiredShowDialogueOptions {
    player: Player;
}
interface ShowDialogueOptions extends Partial<OptionalShowDialogueOptions>, RequiredShowDialogueOptions {
}
interface ResolvedShowDialogueOptions extends RequiredShowDialogueOptions, OptionalShowDialogueOptions {
}
declare abstract class ScriptDialogue<T extends ScriptDialogueResponse> {
    private readonly DefaultShowDialogOptions;
    open(options: ShowDialogueOptions): Promise<T | DialogueCanceledResponse | DialogueRejectedResponse>;
    private show;
    private lockPlayerCamera;
    private unlockPlayerCamera;
    private resolveShowDialogueOptions;
    protected abstract getShowable(options: ResolvedShowDialogueOptions): Showable<FormResponse>;
    protected abstract processResponse(response: FormResponse, options: ResolvedShowDialogueOptions): T;
}
declare abstract class ScriptDialogueResponse {
}
declare class DialogueCanceledResponse extends ScriptDialogueResponse {
    readonly reason: FormCancelationReason;
    constructor(reason: FormCancelationReason);
}
declare class DialogueRejectedResponse extends ScriptDialogueResponse {
    readonly reason?: FormRejectReason;
    readonly exception: unknown;
    constructor(reason: FormRejectReason | undefined, exception: unknown);
}
declare class ButtonDialogueResponse<T extends string> extends ScriptDialogueResponse {
    readonly selected: T;
    constructor(selected: T);
}
interface DualButton<T extends string> {
    name: T;
    text: ScriptDialogueString;
}
declare const dualButtonScriptDialogue: <T extends string>(title: ScriptDialogueString, topButton: DualButton<T>, bottomButton: DualButton<T>) => DualButtonScriptDialogue<T>;
declare class DualButtonScriptDialogue<T extends string> extends ScriptDialogue<ButtonDialogueResponse<T>> {
    readonly title: ScriptDialogueString;
    readonly body?: ScriptDialogueString;
    readonly topButton: DualButton<T>;
    readonly bottomButton: DualButton<T>;
    constructor(title: ScriptDialogueString, body: ScriptDialogueString | undefined, topButton: DualButton<T>, bottomButton: DualButton<T>);
    setBody(body: ScriptDialogueString): DualButtonScriptDialogue<T>;
    protected getShowable(options: ResolvedShowDialogueOptions): Showable<FormResponse>;
    protected processResponse(response: FormResponse, options: ResolvedShowDialogueOptions): ButtonDialogueResponse<T>;
}
declare const multiButtonScriptDialogue: (title: ScriptDialogueString) => MultiButtonScriptDialogueEmpty<never>;
interface MultiButton<T extends string> {
    name: T;
    text: ScriptDialogueString;
    iconPath?: string;
}
type ButtonsType<T extends string> = Array<MultiButton<T>>;
type MultiButtonDialogueReturn<T1 extends string, T2 extends string> = MultiButtonDialogue<NonNullable<T1 | T2>>;
declare class MultiButtonScriptDialogueEmpty<T extends string> {
    readonly title: ScriptDialogueString;
    readonly body?: ScriptDialogueString;
    constructor(title: ScriptDialogueString, body?: ScriptDialogueString);
    setBody(body: ScriptDialogueString): MultiButtonScriptDialogueEmpty<T>;
    addButton<NAME extends string>(name: NAME, text: ScriptDialogueString, iconPath?: string): MultiButtonDialogueReturn<T, NAME>;
    addButtons<NAMES extends string>(buttons: Array<MultiButton<NAMES>>): MultiButtonDialogueReturn<T, NAMES>;
}
declare class MultiButtonDialogue<T extends string> extends ScriptDialogue<ButtonDialogueResponse<T>> {
    readonly title: ScriptDialogueString;
    readonly body?: ScriptDialogueString;
    readonly buttons: ButtonsType<T>;
    constructor(title: ScriptDialogueString, body: ScriptDialogueString | undefined, buttons: ButtonsType<T>);
    setTitle(title: ScriptDialogueString): MultiButtonScriptDialogueEmpty<T>;
    setBody(body: ScriptDialogueString): MultiButtonScriptDialogueEmpty<T>;
    addButton<NAME extends string>(name: NAME, text: ScriptDialogueString, iconPath?: string): MultiButtonDialogueReturn<T, NAME>;
    addButtons<NAMES extends string>(buttons: Array<MultiButton<NAMES>>): MultiButtonDialogueReturn<T, NAMES>;
    protected getShowable(options: ResolvedShowDialogueOptions): Showable<FormResponse>;
    protected processResponse(response: FormResponse, options: ResolvedShowDialogueOptions): ButtonDialogueResponse<T>;
}
type InputValue = string | number | boolean;
declare const inputScriptDialogue: (title: ScriptDialogueString) => InputScriptDialogue<never>;
declare const inputDropdown: <K extends string>(name: K, label: ScriptDialogueString) => InputDropdown<K>;
declare const inputSlider: <K extends string>(name: K, label: ScriptDialogueString, minimumValue: number, maximumValue: number, valueStep: number, defaultValue?: number) => InputSlider<K>;
declare const inputText: <K extends string>(name: K, label: ScriptDialogueString, placeholderText: ScriptDialogueString, defaultValue?: string) => InputText<K>;
declare const inputToggle: <K extends string>(name: K, label: ScriptDialogueString, defaultValue?: boolean) => InputToggle<K>;
declare class InputElement<K extends string> {
    readonly name: K;
    readonly label: ScriptDialogueString;
    constructor(name: K, label: ScriptDialogueString);
}
declare class InputWithDefaultValue<K extends string, V extends InputValue> extends InputElement<K> {
    readonly defaultValue: V;
    constructor(name: K, label: ScriptDialogueString, defaultValue: V);
}
declare class InputDropdownOption {
    readonly label: ScriptDialogueString;
    readonly value: InputValue;
    constructor(label: ScriptDialogueString, value: InputValue);
}
declare class InputDropdown<K extends string> extends InputElement<K> {
    readonly options: ReadonlyArray<InputDropdownOption>;
    readonly defaultValueIndex: number;
    constructor(name: K, label: ScriptDialogueString, options: ReadonlyArray<InputDropdownOption>, defaultValueIndex?: number);
    setDefaultValueIndex(defaultValueIndex: number): InputDropdown<K>;
    addOption(label: ScriptDialogueString, value: InputValue): InputDropdown<K>;
}
declare class InputSlider<K extends string> extends InputWithDefaultValue<K, number> {
    readonly minimumValue: number;
    readonly maximumValue: number;
    readonly valueStep: number;
    constructor(name: K, label: ScriptDialogueString, minimumValue: number, maximumValue: number, valueStep: number, defaultValue?: number);
}
declare class InputText<K extends string> extends InputWithDefaultValue<K, string> {
    readonly placeholderText: ScriptDialogueString;
    constructor(name: K, label: ScriptDialogueString, placeholderText: ScriptDialogueString, defaultValue?: string);
}
declare class InputToggle<K extends string> extends InputWithDefaultValue<K, boolean> {
    constructor(name: K, label: ScriptDialogueString, defaultValue?: boolean);
}
declare class InputScriptDialogue<K extends string> extends ScriptDialogue<InputScriptDialogueResponse<K>> {
    readonly elements: Array<InputElement<K>>;
    readonly title: ScriptDialogueString;
    constructor(title: ScriptDialogueString, elements: Array<InputElement<K>>);
    addElement<KEY extends string>(element: InputElement<KEY>): InputScriptDialogue<K | KEY>;
    addElements<KEY extends string>(elements: Array<InputElement<KEY>>): InputScriptDialogue<K | KEY>;
    protected getShowable(options: ResolvedShowDialogueOptions): Showable<ModalFormResponse>;
    protected processResponse(response: ModalFormResponse, options: ResolvedShowDialogueOptions): InputScriptDialogueResponse<K>;
}
type InputScriptDialogueResponseValues<K extends string> = {
    [key in K]: InputValue;
};
declare class InputScriptDialogueResponse<K extends string> {
    readonly values: InputScriptDialogueResponseValues<K>;
    constructor(values: InputScriptDialogueResponseValues<K>);
}
interface TranslateType {
    (translate: string, with_: RawMessage): RawMessage;
    (translate: string, ...with_: Array<string>): RawMessage;
}
declare const TRANSLATE: TranslateType;
export { dualButtonScriptDialogue, multiButtonScriptDialogue, InputScriptDialogueResponse, inputText, inputToggle, inputSlider, inputDropdown, inputScriptDialogue, ButtonDialogueResponse, ScriptDialogueResponse, ScriptDialogue, DialogueCanceledResponse, DialogueRejectedResponse, ShowDialogueOptions, TRANSLATE };
