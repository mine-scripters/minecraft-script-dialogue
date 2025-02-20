import { FormRejectError, FormCancelationReason, MessageFormData, ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { system } from '@minecraft/server';

const assertNever = (value) => {
    throw new Error(`Invalid param ${value}`);
};
const asyncWait = async (ticks) => {
    return new Promise((resolve) => {
        system.runTimeout(() => {
            resolve();
        }, ticks);
    });
};
const runUntilSuccess = (target, command, expectedCount, stopIf) => {
    return new Promise((resolve) => {
        const handler = system.runInterval(() => {
            const result = target.runCommand(command);
            if (result.successCount === expectedCount || stopIf()) {
                resolve();
                system.clearRun(handler);
            }
        }, 1);
    });
};
const TRANSLATE = (translate, with_, ...with__) => {
    return {
        translate,
        with: typeof with_ === 'string' ? [with_, ...with__] : with_,
    };
};

const DefaultShowDialogOptions = Object.freeze({
    lockPlayerCamera: true,
    busyRetriesCount: 5,
    busyRetriesTick: 5,
});
/**
 * Base class for all the script dialogues
 *
 * @category Script dialogue
 */
class ScriptDialogue {
    constructor() { }
    /**
     * Opens the script dialogue. It requires the {@link ShowDialogueOptions#player player} as one of the options.
     *
     * You can configure displaying features by setting the optional values in the {@link ShowDialogueOptions options}
     * @param options used to configure what and how to display the script dialogue.
     *
     * @see {@link ShowDialogueOptions}
     */
    async open(options) {
        const resolvedOptions = this.resolveShowDialogueOptions(options);
        try {
            if (resolvedOptions.lockPlayerCamera) {
                this.lockPlayerCamera(resolvedOptions);
            }
            try {
                const showable = await this.getShowable(resolvedOptions);
                const response = await this.show(showable, resolvedOptions);
                if (response.canceled) {
                    return new DialogueCanceledResponse(response.cancelationReason);
                }
                return await this.processResponse(response, resolvedOptions);
            }
            catch (e) {
                if (e && e instanceof FormRejectError) {
                    return new DialogueRejectedResponse(e.reason, e);
                }
                else {
                    return new DialogueRejectedResponse(undefined, e);
                }
            }
        }
        finally {
            if (resolvedOptions.lockPlayerCamera) {
                await this.unlockPlayerCamera(resolvedOptions);
            }
        }
    }
    async show(showable, options) {
        let i = 0;
        for (;;) {
            const response = await showable.show(options.player);
            if (response.canceled && response.cancelationReason === FormCancelationReason.UserBusy) {
                if (i < options.busyRetriesCount) {
                    i++;
                    await asyncWait(options.busyRetriesTick);
                    if (options.player.isValid) {
                        continue;
                    }
                }
            }
            return response;
        }
    }
    lockPlayerCamera(options) {
        options.player.runCommand(`inputpermission set "${options.player.name}" camera disabled`);
        options.player.runCommand(`inputpermission set "${options.player.name}" movement disabled`);
    }
    async unlockPlayerCamera(options) {
        await runUntilSuccess(options.player, `inputpermission set "${options.player.name}" camera enabled`, 1, () => !options.player.isValid);
        await runUntilSuccess(options.player, `inputpermission set "${options.player.name}" movement enabled`, 1, () => !options.player.isValid);
    }
    resolveShowDialogueOptions(options) {
        return {
            ...DefaultShowDialogOptions,
            ...options,
        };
    }
}
/**
 * Base class for script dialogue responses
 *
 * @category Responses
 */
class ScriptDialogueResponse {
}
/**
 * Dialogue response when the script dialogue was canceled.
 *
 * Typically this happens if the player was busy when trying to open the script dialogue or if the user
 * pressed the close button (x).
 *
 * Valid reasons can be seen in {@link @minecraft/server-ui!FormCancelationReason FormCancelationReason}
 *
 * @category Responses
 */
class DialogueCanceledResponse extends ScriptDialogueResponse {
    /**
     * Reason the script dialogue was cancel.
     */
    reason;
    /**
     * @internal
     */
    constructor(reason) {
        super();
        this.reason = reason;
    }
}
/**
 * Dialogue response when the script dialogue was rejected, throwing an exception.
 *
 * Reasons can be seen in {@link @minecraft/server-ui!FormRejectReason FormRejectReason} if any reason could be
 * determined.
 *
 * Known reasons can be seen in {@link @minecraft/server-ui!FormRejectReason FormRejectReason}
 * @category Responses
 */
class DialogueRejectedResponse extends ScriptDialogueResponse {
    /**
     * Reason the script dialogue was rejected if there was any, else the {@link exception} needs to be checked
     * to further determine what was the error.
     */
    reason;
    /**
     * Exception that was throw to rejected the script dialogue.
     */
    exception;
    /**
     * @internal
     */
    constructor(reason, exception) {
        super();
        this.reason = reason;
        this.exception = exception;
    }
}
/**
 * Response for button script dialogues.
 *
 * Contains the selected button's name.
 *
 * @category Responses
 * @category Dual button script dialogue
 * @category Multi button script dialogue
 */
class ButtonDialogueResponse extends ScriptDialogueResponse {
    /**
     * Selected button's name.
     *
     * @see {@link DualButton#name}
     * @see {@link MultiButton#name}
     */
    selected;
    callback;
    /**
     * @internal
     */
    constructor(selected, callback) {
        super();
        this.selected = selected;
        this.callback = callback;
    }
}
class MissingButtonsException extends Error {
    constructor() {
        super('Missing buttons');
    }
}

/**
 * Creates a new dual button script dialogue
 *
 * @category Creation
 * @category Dual button script dialogue
 * @param title Title of the dual button script dialogue
 * @param topButton Contents of the top button
 * @param bottomButton Contents of the bottom button
 */
const dualButtonScriptDialogue = (title, topButton, bottomButton) => {
    return new DualButtonScriptDialogue(title, undefined, topButton, bottomButton);
};
/**
 * Dual button script dialogue class.
 *
 * User's don't need to instantiate this class directly, instead they can use {@link dualButtonScriptDialogue}.
 *
 * Allows the users to optionally set a value for the body by calling {@link DualButtonScriptDialogue#setBody setBody}.
 *
 * @category Dual button script dialogue
 */
class DualButtonScriptDialogue extends ScriptDialogue {
    title;
    body;
    topButton;
    bottomButton;
    /**
     * @internal
     */
    constructor(title, body, topButton, bottomButton) {
        super();
        this.title = title;
        this.body = body;
        this.topButton = topButton;
        this.bottomButton = bottomButton;
    }
    /**
     * Sets content of the script dialogue
     * @param body
     */
    setBody(body) {
        return new DualButtonScriptDialogue(this.title, body, this.topButton, this.bottomButton);
    }
    getShowable(_options) {
        const data = new MessageFormData();
        data.title(this.title);
        if (this.body) {
            data.body(this.body);
        }
        data.button1(this.bottomButton.text);
        data.button2(this.topButton.text);
        return data;
    }
    async processResponse(response, _options) {
        const selectedButton = response.selection === 0 ? this.bottomButton : this.topButton;
        let callbackResponse = undefined;
        if (selectedButton.callback) {
            callbackResponse = await selectedButton.callback(selectedButton.name);
        }
        return new ButtonDialogueResponse(selectedButton.name, callbackResponse);
    }
}

/**
 * Initializes a empty multi button script dialogue.
 *
 * Buttons needs to be added using {@link MultiButtonDialogue#addButton} or {@link MultiButtonDialogue#addButtons}
 *
 * @category Creation
 * @category Multi button script dialogue
 * @param title
 */
const multiButtonScriptDialogue = (title) => {
    return new MultiButtonDialogue(title, undefined, []);
};
/**
 * Class used to build multi button script dialogues.
 *
 * Use {@link multiButtonScriptDialogue} to initialize one.
 *
 * @category Multi button script dialogue
 * @see {@link multiButtonScriptDialogue}
 */
class MultiButtonDialogue extends ScriptDialogue {
    title;
    body;
    elements;
    /**
     * @internal
     */
    constructor(title, body, elements) {
        super();
        this.title = title;
        this.body = body;
        this.elements = elements;
    }
    /**
     * Sets the content body of the multi button dialogue
     * @param body
     */
    setBody(body) {
        return new MultiButtonDialogue(this.title, body, this.elements);
    }
    addDivider() {
        return new MultiButtonDialogue(this.title, this.body, [
            ...this.elements,
            {
                type: "divider",
            }
        ]);
    }
    addHeader(text) {
        return new MultiButtonDialogue(this.title, this.body, [
            ...this.elements,
            {
                type: "header",
                text,
            }
        ]);
    }
    addLabel(text) {
        return new MultiButtonDialogue(this.title, this.body, [
            ...this.elements,
            {
                type: "label",
                text,
            }
        ]);
    }
    /**
     * Adds a button to the multi button script dialogue.
     * @param name name of the button
     * @param text content of the button
     * @param iconPath path to an icon to show in the button
     */
    addButton(name, text, iconPath, callback) {
        return new MultiButtonDialogue(this.title, this.body, [
            ...this.elements,
            {
                name,
                text,
                iconPath,
                callback,
            },
        ]);
    }
    /**
     * Adds multiple buttons to the multi button script dialogue.
     * @param buttons array of buttons
     */
    addButtons(buttons) {
        return new MultiButtonDialogue(this.title, this.body, [
            ...this.elements,
            ...buttons,
        ]);
    }
    getShowable(_options) {
        if (this.elements.length === 0) {
            throw new MissingButtonsException();
        }
        const formData = new ActionFormData();
        formData.title(this.title);
        if (this.body) {
            formData.body(this.body);
        }
        this.elements.forEach((element) => {
            if ('type' in element) {
                const type = element.type;
                switch (type) {
                    case 'divider':
                        formData.divider();
                        break;
                    case 'header':
                        formData.header(element.text);
                        break;
                    case 'label':
                        formData.label(element.text);
                        break;
                    default:
                        assertNever(type);
                }
            }
            else {
                formData.button(element.text, element.iconPath);
            }
        });
        return formData;
    }
    async processResponse(response, _options) {
        const buttons = this.elements.filter(e => !("type" in e));
        const selectedButton = buttons[response.selection];
        let callbackResponse = undefined;
        if (selectedButton.callback) {
            callbackResponse = await selectedButton.callback(selectedButton.name);
        }
        return new ButtonDialogueResponse(selectedButton.name, callbackResponse);
    }
}

/**
 * Initializes a empty input script dialogue.
 *
 * Elements needs to be added using {@link InputScriptDialogue#addElement} or {@link InputScriptDialogue#addElements}
 *
 * @category Creation
 * @category Input script dialogue
 *
 * @param title Title for the script dialogue
 */
const inputScriptDialogue = (title) => {
    return new InputScriptDialogue(title, []);
};
/**
 * Creates a new dropdown element to use in a input script dialogue.
 *
 * @category Input script dialogue
 * @param name
 * @param label
 */
const inputDropdown = (name, label) => {
    return new InputDropdown(name, label, [], 0);
};
/**
 * Creates a new slider element to use in a input script dialogue.
 *
 * @category Input script dialogue
 * @param name
 * @param label
 * @param minimumValue
 * @param maximumValue
 * @param valueStep
 * @param defaultValue
 */
const inputSlider = (name, label, minimumValue, maximumValue, valueStep, defaultValue) => {
    return new InputSlider(name, label, minimumValue, maximumValue, valueStep, defaultValue);
};
/**
 * Creates a new text field element to use in a input script dialogue.
 *
 * @category Input script dialogue
 * @param name
 * @param label
 * @param placeholderText
 * @param defaultValue
 */
const inputText = (name, label, placeholderText, defaultValue) => {
    return new InputText(name, label, placeholderText, defaultValue);
};
/**
 * Creates a new toggle element to use in a input script dialogue.
 *
 * @category Input script dialogue
 * @param name
 * @param label
 * @param defaultValue
 */
const inputToggle = (name, label, defaultValue) => {
    return new InputToggle(name, label, defaultValue);
};
/**
 * Base for all input elements displayed in the input script dialogue.
 *
 * You don't need to instantiate this class directly, instead you can use any of the builder function
 * depending the type you want to use.
 *
 * @category Input script dialogue
 * @see {@link inputDropdown}
 * @see {@link inputSlider}
 * @see {@link inputToggle}
 * @see {@link inputText}
 */
class InputElement {
    /**
     * @internal
     */
    name;
    /**
     * @internal
     */
    label;
    /**
     * @internal
     */
    constructor(name, label) {
        this.name = name;
        this.label = label;
    }
}
/**
 * Base for all input elements that have a fixed default value.
 *
 * You don't need to instantiate this class directly, instead you can use any of the builder function
 * depending the type you want to use.
 *
 * @category Input script dialogue
 * @see {@link inputDropdown}
 * @see {@link inputSlider}
 * @see {@link inputToggle}
 * @see {@link inputText}
 */
class InputWithDefaultValue extends InputElement {
    /**
     * @internal
     */
    defaultValue;
    /**
     * @internal
     */
    constructor(name, label, defaultValue) {
        super(name, label);
        this.defaultValue = defaultValue;
    }
}
/**
 * @internal
 */
class InputDropdownOption {
    label;
    value;
    constructor(label, value) {
        this.label = label;
        this.value = value;
    }
}
/**
 * Input element's representation of a dropdown.
 *
 * Instantiate by using {@link inputDropdown}
 *
 * @category Input script dialogue
 * @see {@link inputDropdown}
 */
class InputDropdown extends InputElement {
    /**
     * @internal
     */
    options;
    /**
     * @internal
     */
    defaultValueIndex;
    /**
     * @internal
     */
    constructor(name, label, options, defaultValueIndex) {
        super(name, label);
        this.defaultValueIndex = defaultValueIndex ?? 0;
        this.options = options;
    }
    /**
     * Sets the default index of the option you would like to use
     * @param defaultValueIndex
     */
    setDefaultValueIndex(defaultValueIndex) {
        return new InputDropdown(this.name, this.label, [...this.options], defaultValueIndex);
    }
    /**
     * Adds an option to the dropdown
     * @param label
     * @param value
     */
    addOption(label, value) {
        return new InputDropdown(this.name, this.label, [...this.options, new InputDropdownOption(label, value)], this.defaultValueIndex);
    }
}
/**
 * Input element's representation of a slider.
 *
 * Instantiate by using {@link inputSlider}
 *
 * @category Input script dialogue
 * @see {@link inputSlider}
 */
class InputSlider extends InputWithDefaultValue {
    /**
     * @internal
     */
    minimumValue;
    /**
     * @internal
     */
    maximumValue;
    /**
     * @internal
     */
    valueStep;
    /**
     * @internal
     */
    constructor(name, label, minimumValue, maximumValue, valueStep, defaultValue) {
        super(name, label, defaultValue ?? minimumValue);
        this.minimumValue = minimumValue;
        this.maximumValue = maximumValue;
        this.valueStep = valueStep;
    }
}
/**
 * Input element's representation of text field.
 *
 * Instantiate by using {@link inputText}
 *
 * @category Input script dialogue
 * @see {@link inputText}
 */
class InputText extends InputWithDefaultValue {
    /**
     * @internal
     */
    placeholderText;
    /**
     * @internal
     */
    constructor(name, label, placeholderText, defaultValue) {
        super(name, label, defaultValue ?? '');
        this.placeholderText = placeholderText;
    }
}
/**
 * Input element's representation of toggle.
 *
 * Instantiate by using {@link inputToggle}
 *
 * @category Input script dialogue
 * @see {@link inputToggle}
 */
class InputToggle extends InputWithDefaultValue {
    /**
     * @internal
     */
    constructor(name, label, defaultValue) {
        super(name, label, !!defaultValue);
    }
}
/**
 * Class used to build input script dialogues.
 *
 * Use {@link inputScriptDialogue} to initialize one.
 *
 * @category Input script dialogue
 * @see {@link inputScriptDialogue}
 */
class InputScriptDialogue extends ScriptDialogue {
    elements;
    title;
    submitButton;
    // work around TS2848: The right-hand side of an instanceof expression must not be an instantiation expression.
    InputDropdown = (InputDropdown);
    InputSlider = (InputSlider);
    InputText = (InputText);
    InputToggle = (InputToggle);
    /**
     * @internal
     */
    constructor(title, elements, submitButton) {
        super();
        this.title = title;
        this.elements = elements;
        this.submitButton = submitButton;
    }
    withSubmitButton(submitButton) {
        return new InputScriptDialogue(this.title, [...this.elements], submitButton);
    }
    addDivider() {
        return new InputScriptDialogue(this.title, [...this.elements, {
                type: "divider",
            }], this.submitButton);
    }
    addHeader(text) {
        return new InputScriptDialogue(this.title, [...this.elements, {
                type: "header",
                text,
            }], this.submitButton);
    }
    addLabel(text) {
        return new InputScriptDialogue(this.title, [...this.elements, {
                type: "label",
                text,
            }], this.submitButton);
    }
    /**
     * Adds an input element to the input script dialogue.
     * @param element
     *
     * @see {@link inputDropdown}
     * @see {@link inputSlider}
     * @see {@link inputToggle}
     * @see {@link inputText}
     */
    addElement(element) {
        return new InputScriptDialogue(this.title, [...this.elements, element], this.submitButton);
    }
    /**
     * Adds multiple input element to the input script dialogue.
     * @param elements
     *
     * @see {@link inputDropdown}
     * @see {@link inputSlider}
     * @see {@link inputToggle}
     * @see {@link inputText}
     */
    addElements(elements) {
        return new InputScriptDialogue(this.title, [...this.elements, ...elements], this.submitButton);
    }
    getShowable(_options) {
        if (this.elements.length === 0) {
            throw new MissingElementsError();
        }
        const data = new ModalFormData();
        data.title(this.title);
        if (this.submitButton) {
            data.submitButton(this.submitButton);
        }
        this.elements.forEach((element) => {
            if (element instanceof this.InputDropdown) {
                if (element.options.length === 0) {
                    throw new MissingDropdownOptionsError(element.name);
                }
                data.dropdown(element.label, element.options.map((o) => o.label), element.defaultValueIndex);
            }
            else if (element instanceof this.InputSlider) {
                data.slider(element.label, element.minimumValue, element.maximumValue, element.valueStep, element.defaultValue);
            }
            else if (element instanceof this.InputText) {
                data.textField(element.label, element.placeholderText, element.defaultValue);
            }
            else if (element instanceof this.InputToggle) {
                data.toggle(element.label, element.defaultValue);
            }
            else if ("type" in element) {
                const type = element.type;
                switch (type) {
                    case 'divider':
                        data.divider();
                        break;
                    case 'label':
                        data.label(element.text);
                        break;
                    case 'header':
                        data.header(element.text);
                        break;
                    default:
                        assertNever(type);
                }
            }
        });
        return data;
    }
    async processResponse(response, _options) {
        const formValues = response.formValues ?? this.elements.map((_e) => undefined);
        const values = this.elements.filter(e => !("type" in e)).map((element, index) => {
            const name = element.name;
            let value = 0;
            const formValue = formValues[index];
            if (element instanceof this.InputDropdown) {
                value = element.options[element.defaultValueIndex].value;
                if (formValue !== undefined) {
                    value = element.options[formValue].value;
                }
            }
            else if (element instanceof this.InputSlider ||
                element instanceof this.InputText ||
                element instanceof this.InputToggle) {
                value = element.defaultValue;
                if (formValue !== undefined) {
                    value = formValue;
                }
            }
            return {
                [name]: value,
            };
        });
        return new InputScriptDialogueResponse(Object.assign({}, ...values));
    }
}
/**
 * Script dialogue response from a input script dialogue.
 * Holds a map with the values used by each of the element's name.
 *
 * @category Input script dialogue
 * @category Responses
 */
class InputScriptDialogueResponse {
    /**
     * Map with the values of the script dialogue..
     */
    values;
    constructor(values) {
        this.values = values;
    }
}
class MissingElementsError extends Error {
    constructor() {
        super('Missing input elements');
    }
}
class MissingDropdownOptionsError extends Error {
    constructor(name) {
        super(`Missing dropdown options for ${name}`);
    }
}

export { ButtonDialogueResponse, DialogueCanceledResponse, DialogueRejectedResponse, DualButtonScriptDialogue, InputScriptDialogueResponse, MissingButtonsException, MissingElementsError, MultiButtonDialogue, ScriptDialogue, ScriptDialogueResponse, TRANSLATE, dualButtonScriptDialogue, inputDropdown, inputScriptDialogue, inputSlider, inputText, inputToggle, multiButtonScriptDialogue };
//# sourceMappingURL=MinecraftScriptDialogue.js.map
