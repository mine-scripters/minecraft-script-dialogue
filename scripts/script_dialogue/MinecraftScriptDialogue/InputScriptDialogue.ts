import { ResolvedShowDialogueOptions, ScriptDialogue, ScriptDialogueString, Showable } from './ScriptDialogue';
import { ModalFormData, ModalFormResponse } from '@minecraft/server-ui';

type InputValue = string | number | boolean;

export const inputScriptDialogue = (title: ScriptDialogueString) => {
  return new InputScriptDialogue<never>(title, []);
};

export const inputDropdown = <K extends string>(name: K, label: ScriptDialogueString) => {
  return new InputDropdown<K>(name, label, [], 0);
};

export const inputSlider = <K extends string>(
  name: K,
  label: ScriptDialogueString,
  minimumValue: number,
  maximumValue: number,
  valueStep: number,
  defaultValue?: number
) => {
  return new InputSlider<K>(name, label, minimumValue, maximumValue, valueStep, defaultValue);
};

export const inputText = <K extends string>(
  name: K,
  label: ScriptDialogueString,
  placeholderText: ScriptDialogueString,
  defaultValue?: string
) => {
  return new InputText<K>(name, label, placeholderText, defaultValue);
};

export const inputToggle = <K extends string>(name: K, label: ScriptDialogueString, defaultValue?: boolean) => {
  return new InputToggle<K>(name, label, defaultValue);
};

class InputElement<K extends string> {
  readonly name: K;
  readonly label: ScriptDialogueString;

  constructor(name: K, label: ScriptDialogueString) {
    this.name = name;
    this.label = label;
  }
}

class InputWithDefaultValue<K extends string, V extends InputValue> extends InputElement<K> {
  readonly defaultValue: V;

  constructor(name: K, label: ScriptDialogueString, defaultValue: V) {
    super(name, label);
    this.defaultValue = defaultValue;
  }
}

class InputDropdownOption {
  readonly label: ScriptDialogueString;
  readonly value: InputValue;

  constructor(label: ScriptDialogueString, value: InputValue) {
    this.label = label;
    this.value = value;
  }
}

class InputDropdown<K extends string> extends InputElement<K> {
  readonly options: ReadonlyArray<InputDropdownOption>;
  readonly defaultValueIndex: number;

  constructor(
    name: K,
    label: ScriptDialogueString,
    options: ReadonlyArray<InputDropdownOption>,
    defaultValueIndex?: number
  ) {
    super(name, label);
    this.defaultValueIndex = defaultValueIndex ?? 0;
    this.options = options;
  }

  setDefaultValueIndex(defaultValueIndex: number) {
    return new InputDropdown<K>(this.name, this.label, [...this.options], defaultValueIndex);
  }

  addOption(label: ScriptDialogueString, value: InputValue): InputDropdown<K> {
    return new InputDropdown<K>(
      this.name,
      this.label,
      [...this.options, new InputDropdownOption(label, value)],
      this.defaultValueIndex
    );
  }
}

class InputSlider<K extends string> extends InputWithDefaultValue<K, number> {
  readonly minimumValue: number;
  readonly maximumValue: number;
  readonly valueStep: number;
  constructor(
    name: K,
    label: ScriptDialogueString,
    minimumValue: number,
    maximumValue: number,
    valueStep: number,
    defaultValue?: number
  ) {
    super(name, label, defaultValue ?? minimumValue);
    this.minimumValue = minimumValue;
    this.maximumValue = maximumValue;
    this.valueStep = valueStep;
  }
}

class InputText<K extends string> extends InputWithDefaultValue<K, string> {
  readonly placeholderText: ScriptDialogueString;

  constructor(name: K, label: ScriptDialogueString, placeholderText: ScriptDialogueString, defaultValue?: string) {
    super(name, label, defaultValue ?? '');
    this.placeholderText = placeholderText;
  }
}

class InputToggle<K extends string> extends InputWithDefaultValue<K, boolean> {
  constructor(name: K, label: ScriptDialogueString, defaultValue?: boolean) {
    super(name, label, !!defaultValue);
  }
}

class InputScriptDialogue<K extends string> extends ScriptDialogue<InputScriptDialogueResponse<K>> {
  readonly elements: Array<InputElement<K>>;
  readonly title: ScriptDialogueString;

  constructor(title: ScriptDialogueString, elements: Array<InputElement<K>>) {
    super();
    this.title = title;
    this.elements = elements;
  }

  addElement<KEY extends string>(element: InputElement<KEY>) {
    return new InputScriptDialogue<K | KEY>(this.title, [...this.elements, element]);
  }

  addElements<KEY extends string>(elements: Array<InputElement<KEY>>) {
    return new InputScriptDialogue<K | KEY>(this.title, [...this.elements, ...elements]);
  }

  protected getShowable(options: ResolvedShowDialogueOptions): Showable<ModalFormResponse> {
    const data = new ModalFormData();

    data.title(this.title);

    this.elements.forEach((element) => {
      if (element instanceof InputDropdown<K>) {
        data.dropdown(
          element.label,
          element.options.map((o) => o.label),
          element.defaultValueIndex
        );
      } else if (element instanceof InputSlider<K>) {
        data.slider(element.label, element.minimumValue, element.maximumValue, element.valueStep, element.defaultValue);
      } else if (element instanceof InputText<K>) {
        data.textField(element.label, element.placeholderText, element.defaultValue);
      } else if (element instanceof InputToggle<K>) {
        data.toggle(element.label, element.defaultValue);
      }
    });

    return data;
  }

  protected processResponse(
    response: ModalFormResponse,
    options: ResolvedShowDialogueOptions
  ): InputScriptDialogueResponse<K> {
    const formValues = response.formValues ?? this.elements.map((_e) => undefined);

    const values = this.elements.map((element, index) => {
      const name = element.name;
      let value: InputValue = 0;
      const formValue = formValues[index];

      if (element instanceof InputDropdown<K>) {
        value = element.options[element.defaultValueIndex].value;
        if (formValue !== undefined) {
          value = element.options[formValue as number].value;
        }
      } else if (
        element instanceof InputSlider<K> ||
        element instanceof InputText<K> ||
        element instanceof InputToggle<K>
      ) {
        value = element.defaultValue;
        if (formValue !== undefined) {
          value = formValue;
        }
      }

      return {
        [name]: value,
      };
    }) as InputScriptDialogueResponseValues<K>;

    return new InputScriptDialogueResponse<K>(values);
  }
}

type InputScriptDialogueResponseValues<K extends string> = {
  [key in K]: InputValue;
};

export class InputScriptDialogueResponse<K extends string> {
  readonly values: InputScriptDialogueResponseValues<K>;

  constructor(values: InputScriptDialogueResponseValues<K>) {
    this.values = values;
  }
}
