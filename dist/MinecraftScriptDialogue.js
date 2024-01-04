import { FormCancelationReason, MessageFormData, ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { system } from '@minecraft/server';

const asyncWait = async (ticks) => {
    return new Promise((resolve) => {
        system.runTimeout(() => {
            resolve();
        }, ticks);
    });
};
const TRANSLATE = (translate, with_) => ({
    translate,
    with: typeof with_ === 'string' ? [with_] : with_,
});
// Use a builder pattern
// builder pattern: https://medium.com/geekculture/implementing-a-type-safe-object-builder-in-typescript-e973f5ecfb9c
// Needs updating to support optional types
// class ObjectBuilder {
//   public static new<Target>(): IWith<Target, {}> {
//     return new Builder<Target, {}>({});
//   }
// }
//
// interface IWith<Target, Supplied> {
//   with<T extends Omit<Target, keyof Supplied>, K extends keyof T>(
//     key: K,
//     value: T[K],
//   ): keyof Omit<Omit<Target, keyof Supplied>, K> extends never
//     ? IBuild<Target>
//     : IWith<Target, Supplied & Pick<T, K>>;
// }
//
// interface IBuild<Target> {
//   build(): Target;
// }
//
// class Builder<Target, Supplied> implements IBuild<Target>, IWith<Target, Supplied> {
//   constructor(private target: Partial<Target>) {}
//
//   with<T extends Omit<Target, keyof Supplied>, K extends keyof T>(key: K, value: T[K]) {
//     const target: Partial<Target> = { ...this.target, [key]: value };
//
//     return new Builder<Target, Supplied & Pick<T, K>>(target);
//   }
//
//   build() {
//     return this.target as Target;
//   }
// }

class ScriptDialogue {
    DefaultShowDialogOptions = Object.freeze({
        lockPlayerCamera: true,
        busyRetriesCount: 5,
        busyRetriesTick: 5,
    });
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
                return this.processResponse(response, resolvedOptions);
            }
            catch (e) {
                if (e && typeof e === 'object' && 'reason' in e) {
                    const exception = e;
                    return new DialogueRejectedResponse(exception.reason, exception);
                }
                else {
                    return new DialogueRejectedResponse(undefined, e);
                }
            }
        }
        finally {
            if (resolvedOptions.lockPlayerCamera) {
                this.unlockPlayerCamera(resolvedOptions);
            }
        }
    }
    async show(showable, options) {
        let i = 0;
        while (true) {
            const response = await showable.show(options.player);
            if (response.canceled && response.cancelationReason === FormCancelationReason.UserBusy) {
                if (i < options.busyRetriesCount) {
                    i++;
                    await asyncWait(options.busyRetriesTick);
                    if (options.player.isValid()) {
                        continue;
                    }
                }
            }
            return response;
        }
    }
    lockPlayerCamera(options) {
        options.player.runCommand(`inputpermission set ${options.player.name} camera disabled`);
        options.player.runCommand(`inputpermission set ${options.player.name} movement disabled`);
    }
    unlockPlayerCamera(options) {
        options.player.runCommand(`inputpermission set ${options.player.name} camera enabled`);
        options.player.runCommand(`inputpermission set ${options.player.name} movement enabled`);
    }
    resolveShowDialogueOptions(options) {
        return {
            ...this.DefaultShowDialogOptions,
            ...options,
        };
    }
}
class ScriptDialogueResponse {
}
class DialogueCanceledResponse extends ScriptDialogueResponse {
    reason;
    constructor(reason) {
        super();
        this.reason = reason;
    }
}
class DialogueRejectedResponse extends ScriptDialogueResponse {
    reason;
    exception;
    constructor(reason, exception) {
        super();
        this.reason = reason;
        this.exception = exception;
    }
}
class ButtonDialogueResponse extends ScriptDialogueResponse {
    selected;
    constructor(selected) {
        super();
        this.selected = selected;
    }
}

const dualButtonScriptDialogue = (title, topButton, bottomButton) => {
    return new DualButtonScriptDialogue(title, undefined, topButton, bottomButton);
};
class DualButtonScriptDialogue extends ScriptDialogue {
    title;
    body;
    topButton;
    bottomButton;
    constructor(title, body, topButton, bottomButton) {
        super();
        this.title = title;
        this.body = body;
        this.topButton = topButton;
        this.bottomButton = bottomButton;
    }
    setBody(body) {
        return new DualButtonScriptDialogue(this.title, body, this.topButton, this.bottomButton);
    }
    getShowable(options) {
        const data = new MessageFormData();
        data.title(this.title);
        if (this.body) {
            data.body(this.body);
        }
        data.button1(this.bottomButton.text);
        data.button2(this.topButton.text);
        return data;
    }
    processResponse(response, options) {
        const selectedButton = response.selection === 0 ? this.bottomButton : this.topButton;
        return new ButtonDialogueResponse(selectedButton.name);
    }
}

const multiButtonScriptDialogue = (title) => {
    return new MultiButtonScriptDialogueEmpty(title);
};
class MultiButtonScriptDialogueEmpty {
    title;
    body;
    constructor(title, body) {
        this.title = title;
        this.body = body;
    }
    setBody(body) {
        return new MultiButtonScriptDialogueEmpty(this.title, body);
    }
    addButton(name, text, iconPath) {
        return new MultiButtonDialogue(this.title, this.body, [
            {
                name,
                text,
                iconPath,
            },
        ]);
    }
    addButtons(buttons) {
        return new MultiButtonDialogue(this.title, this.body, [...buttons]);
    }
}
class MultiButtonDialogue extends ScriptDialogue {
    title;
    body;
    buttons;
    constructor(title, body, buttons) {
        super();
        this.title = title;
        this.body = body;
        this.buttons = buttons;
    }
    setTitle(title) {
        return new MultiButtonDialogue(title, this.body, this.buttons);
    }
    setBody(body) {
        return new MultiButtonDialogue(this.title, body, this.buttons);
    }
    addButton(name, text, iconPath) {
        return new MultiButtonDialogue(this.title, this.body, [
            ...this.buttons,
            {
                name,
                text,
                iconPath,
            },
        ]);
    }
    addButtons(buttons) {
        return new MultiButtonDialogue(this.title, this.body, [
            ...this.buttons,
            ...buttons,
        ]);
    }
    getShowable(options) {
        const formData = new ActionFormData();
        formData.title(this.title);
        if (this.body) {
            formData.body(this.body);
        }
        this.buttons.forEach((button) => {
            formData.button(button.text, button.iconPath);
        });
        return formData;
    }
    processResponse(response, options) {
        const selectedButton = this.buttons[response.selection];
        return new ButtonDialogueResponse(selectedButton.name);
    }
}

const inputScriptDialogue = (title) => {
    return new InputScriptDialogue(title, []);
};
const inputDropdown = (name, label) => {
    return new InputDropdown(name, label, [], 0);
};
const inputSlider = (name, label, minimumValue, maximumValue, valueStep, defaultValue) => {
    return new InputSlider(name, label, minimumValue, maximumValue, valueStep, defaultValue);
};
const inputText = (name, label, placeholderText, defaultValue) => {
    return new InputText(name, label, placeholderText, defaultValue);
};
const inputToggle = (name, label, defaultValue) => {
    return new InputToggle(name, label, defaultValue);
};
class InputElement {
    name;
    label;
    constructor(name, label) {
        this.name = name;
        this.label = label;
    }
}
class InputWithDefaultValue extends InputElement {
    defaultValue;
    constructor(name, label, defaultValue) {
        super(name, label);
        this.defaultValue = defaultValue;
    }
}
class InputDropdownOption {
    label;
    value;
    constructor(label, value) {
        this.label = label;
        this.value = value;
    }
}
class InputDropdown extends InputElement {
    options;
    defaultValueIndex;
    constructor(name, label, options, defaultValueIndex) {
        super(name, label);
        this.defaultValueIndex = defaultValueIndex ?? 0;
        this.options = options;
    }
    setDefaultValueIndex(defaultValueIndex) {
        return new InputDropdown(this.name, this.label, [...this.options], defaultValueIndex);
    }
    addOption(label, value) {
        return new InputDropdown(this.name, this.label, [...this.options, new InputDropdownOption(label, value)], this.defaultValueIndex);
    }
}
class InputSlider extends InputWithDefaultValue {
    minimumValue;
    maximumValue;
    valueStep;
    constructor(name, label, minimumValue, maximumValue, valueStep, defaultValue) {
        super(name, label, defaultValue ?? minimumValue);
        this.minimumValue = minimumValue;
        this.maximumValue = maximumValue;
        this.valueStep = valueStep;
    }
}
class InputText extends InputWithDefaultValue {
    placeholderText;
    constructor(name, label, placeholderText, defaultValue) {
        super(name, label, defaultValue ?? '');
        this.placeholderText = placeholderText;
    }
}
class InputToggle extends InputWithDefaultValue {
    constructor(name, label, defaultValue) {
        super(name, label, !!defaultValue);
    }
}
class InputScriptDialogue extends ScriptDialogue {
    elements;
    title;
    constructor(title, elements) {
        super();
        this.title = title;
        this.elements = elements;
    }
    addElement(element) {
        return new InputScriptDialogue(this.title, [...this.elements, element]);
    }
    addElements(elements) {
        return new InputScriptDialogue(this.title, [...this.elements, ...elements]);
    }
    getShowable(options) {
        const data = new ModalFormData();
        data.title(this.title);
        this.elements.forEach((element) => {
            if (element instanceof (InputDropdown)) {
                data.dropdown(element.label, element.options.map((o) => o.label), element.defaultValueIndex);
            }
            else if (element instanceof (InputSlider)) {
                data.slider(element.label, element.minimumValue, element.maximumValue, element.valueStep, element.defaultValue);
            }
            else if (element instanceof (InputText)) {
                data.textField(element.label, element.placeholderText, element.defaultValue);
            }
            else if (element instanceof (InputToggle)) {
                data.toggle(element.label, element.defaultValue);
            }
        });
        return data;
    }
    processResponse(response, options) {
        const formValues = response.formValues ?? this.elements.map((_e) => undefined);
        const values = this.elements.map((element, index) => {
            const name = element.name;
            let value = 0;
            const formValue = formValues[index];
            if (element instanceof (InputDropdown)) {
                value = element.options[element.defaultValueIndex].value;
                if (formValue !== undefined) {
                    value = element.options[formValue].value;
                }
            }
            else if (element instanceof (InputSlider) ||
                element instanceof (InputText) ||
                element instanceof (InputToggle)) {
                value = element.defaultValue;
                if (formValue !== undefined) {
                    value = formValue;
                }
            }
            return {
                [name]: value,
            };
        });
        return new InputScriptDialogueResponse(values);
    }
}
class InputScriptDialogueResponse {
    values;
    constructor(values) {
        this.values = values;
    }
}

export { ButtonDialogueResponse, DialogueCanceledResponse, DialogueRejectedResponse, InputScriptDialogueResponse, ScriptDialogue, ScriptDialogueResponse, TRANSLATE, dualButtonScriptDialogue, inputDropdown, inputScriptDialogue, inputSlider, inputText, inputToggle, multiButtonScriptDialogue };
