# Minecraft Script Dialogue

Minecraft Script Dialogue is a library designed to enhance the usage of
[@minecraft/server-ui](https://www.npmjs.com/package/@minecraft/server-ui)
by offering a more convenient API.

## Why Use Minecraft Script Dialogue?

While working with [@minecraft/server-ui](https://www.npmjs.com/package/@minecraft/server-ui),
I encountered several issues and nuances that weren't immediately apparent.
To address these challenges, I created this library to provide a more user-friendly and abstracted API.

Some of the issues addressed by this library include:

- Answers being returned by index, making dynamic dialogues challenging to manage.
- Camera movement when moving the mouse between dialogues, affecting the overall polish.
- Lack of clarity on specific API functionalities, such as distinguishing between different types of dialogues.
- The player may be in a 'busy' status when attempting to display a dialogue, often caused by
  factors such as having an open chat, initiating the dialogue from an NPC dialogue, or other
  ongoing activities. This state of being 'busy' can prevent the script dialogue from being shown.

While future revisions of the API may address these concerns, this library aims to alleviate them in the meantime.

## API Capabilities

The Minecraft Script Dialogue library exposes the following capabilities:

- Multiple buttons script dialogue
- Dual buttons script dialogue
- Inputs script dialogue

### Usage of Dual and Multiple Buttons Script Dialogue

Here is a sample code snippet demonstrating the usage of dual and multiple buttons script dialogue:

```typescript
// Or '@mine-scripters/minecraft-script-dialogue' depending on your setup
import { dualButtonScriptDialogue, multiButtonScriptDialogue } from './MinescriptScriptDialogue';
import { Player } from '@minecraft/server';

const askQuestionToPlayer = async (player: Player) => {
  const response = await multiButtonScriptDialogue('Breakfast')
    .setBody('How would you like your eggs?')
    .addButton('scrambled', 'Scrambled please!')
    .addButton('sunny', 'Sunny side up!')
    .addButton('no-yolk', 'Without yolk')
    .open({ player });

  // Response could be ButtonDialogueResponse, DialogueCanceledResponse or DialogueRejectedResponse
  if (response instanceof ButtonDialogueResponse) {
    const areYouSureResponse = await dualButtonScriptDialogue(
      'Question',
      {
        name: 'yes',
        text: 'Yes!!',
      },
      {
        name: 'no',
        text: 'No way.',
      }
    )
      .setBody(`Are you sure you want your eggs ${response.selected} ?!`)
      .open({ player });

    if (areYouSureResponse instanceof ButtonDialogueResponse && areYouSureResponse.selected === 'yes') {
      // selected can be one of: 'scrambled' | 'sunny' | 'no-yolk'
      player.removeTag('eggs-scrambled');
      player.removeTag('eggs-sunny');
      player.removeTag('eggs-no-yolk');
      switch (response.selected) {
        case 'scrambled':
          player.addTag('eggs-scrambled');
          break;
        case 'sunny':
          player.addTag('eggs-sunny');
          break;
        case 'no-yolk':
          player.addTag('eggs-no-yolk');
          break;
      }
    }
  }
};
```

### Usage of Input Script Dialogue

Another example showcasing the usage of input script dialogue:

```typescript
// Or '@mine-scripters/minecraft-script-dialogue' depending on your setup
import {
  multiButtonScriptDialogue,
  inputDropdown,
  inputScriptDialogue,
  InputScriptDialogueResponse,
  inputSlider,
  inputText,
  inputToggle,
} from './MinescriptScriptDialogue';
import { Player } from '@minecraft/server';

const showInputScriptDialogue = async (player: Player) => {
  const inputResponse = await inputScriptDialogue('I am the input script dialogue')
    .addElement(
      inputDropdown('my-dropdown', 'My dropdown')
        .addOption('My first label', 'label-1')
        .addOption('My second label', 'label-2')
        .addOption('Last label', 'label-3')
        .setDefaultValueIndex(1) // Selects "My second label"
    )
    // Slider from 10 to 20, goes on by 2 and 10 is selected by default
    .addElement(inputSlider('slider', 'The slider', 10, 20, 2, 10))
    // Active toggle
    .addElement(inputToggle('t1', 'The toggle!', true))
    // Text input
    .addElement(inputText('text1', 'What do you want to write???', 'I am the placeholder', 'default value'))
    .open({
      player,
    });

  if (inputResponse instanceof InputScriptDialogueResponse) {
    // Values can be found on `inputResponse.values`, indexed by the name.
    // e.g. { "my-dropdown": "label-3", "slider": 14, "t1": true, "text1": "My stuff" }
    await multiButtonScriptDialogue('You selected')
      .setBody(`You've selected:\n ${JSON.stringify(inputResponse.values, undefined, 2)}`)
      .addButtons([
        {
          name: 'ok',
          text: 'OK',
        },
      ])
      .open({
        player,
      });
  }
};
```

## Installation

To integrate Minecraft Script Dialogue into your project, follow these steps:

### Using a Code Bundler

If you are using a code bundler like [rollup](https://rollupjs.org/) or a similar tool,
you can include [@mine-scripters/minecraft-script-dialogue](https://www.npmjs.com/package/@mine-scripters/minecraft-script-dialogue) in your build.

### Manual Installation

Alternatively, you can manually include the library files from the [dist](./dist) directory in your project.

## Documentation

You can check the API hosted in [github pages](https://mine-scripters.github.io/minecraft-script-dialogue/):
https://mine-scripters.github.io/minecraft-script-dialogue/
