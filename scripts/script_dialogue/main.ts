import { Player, system } from '@minecraft/server';
import {
  multiButtonScriptDialogue,
  TRANSLATE,
  ButtonDialogueResponse,
  dualButtonScriptDialogue,
  inputDropdown,
  inputScriptDialogue,
  InputScriptDialogueResponse,
  inputSlider,
  inputText,
  inputToggle,
} from './MinecraftScriptDialogue';

system.afterEvents.scriptEventReceive.subscribe(async (event) => {
  if (event.id === 'minescripters:test-script-dialogue-01' && event.sourceEntity instanceof Player) {
    const player = event.sourceEntity;
    const response = await multiButtonScriptDialogue(TRANSLATE('minescripters:example_01.title'))
      .setBody('This is my content')
      .addButton('one', 'Button with callback', undefined, async (selected) => {
        await multiButtonScriptDialogue('You selected')
          .setBody(`You've selected: ${selected} using the Callback`)
          .addButtons([
            {
              name: 'ok',
              text: 'OK',
            },
          ])
          .open({
            player,
          });
      })
      .addButton('two', 'Button two')
      .addButton('three', 'Button three')
      .open({
        player,
        lockPlayerCamera: true,
        busyRetriesCount: 10,
        busyRetriesTick: 40,
      });

    if (response instanceof ButtonDialogueResponse) {
      await multiButtonScriptDialogue('You selected')
        .setBody(`You've selected: ${response.selected}`)
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
  } else if (event.id === 'minescripters:test-script-dialogue-02' && event.sourceEntity instanceof Player) {
    // Try sending this event and opening the chat window again.
    // Minecraft can't open a dialogue in that situation as you are "busy".
    // We will retry showing the dialog up to 5 times by default, waiting 5 ticks between each try.
    // We can configure these values when opening the dialogue.
    const player = event.sourceEntity;
    system.runTimeout(async () => {
      await multiButtonScriptDialogue('I must open!')
        .setBody('I have been trying to contact you for a while!')
        .addButton('ok', 'Yeah... OK!')
        .open({
          player,
          lockPlayerCamera: true,
          busyRetriesCount: 10,
          busyRetriesTick: 20,
        });
    }, 40);
  } else if (event.id === 'minescripters:test-script-dialogue-03' && event.sourceEntity instanceof Player) {
    // We also support the dual button and the input dialogue

    const player = event.sourceEntity;
    const response = await dualButtonScriptDialogue(
      'Dual button',
      {
        name: 'top',
        text: 'Show input button',
      },
      {
        name: 'bottom',
        text: 'Cancel',
      }
    ).open({
      player,
    });

    if (response instanceof ButtonDialogueResponse) {
      if (response.selected === 'top') {
        const inputResponse = await inputScriptDialogue('I am the input script dialogue')
          .addElement(
            inputDropdown('d1', 'My dropdown')
              .addOption('My first label', 'label-1')
              .addOption('My second label', 'other-label')
              .setDefaultValueIndex(1)
          )
          .addElement(inputSlider('s1', 'The slider', 10, 20, 2, 10))
          .addElement(inputToggle('t1', 'The toggle!', true))
          .addElement(inputText('text1', 'What do you want to write???', 'I am the placeholder', 'default value'))
          .open({
            player,
          });

        if (inputResponse instanceof InputScriptDialogueResponse) {
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
      }
    }
  }
});
