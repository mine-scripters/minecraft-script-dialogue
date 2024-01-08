import { ScriptDialogue } from "./ScriptDialogue";
import { FormCancelationReason, FormRejectReason, MessageFormData, MessageFormResponse } from '@minecraft/server-ui';
import { ButtonDialogueResponse, DialogueCanceledResponse, DialogueRejectedResponse } from './ScriptDialogue';
import { FormRejectError } from '../../../__mocks__/@minecraft/server-ui';
import { mockPlayer } from '../test/server-utils';
import {dualButtonScriptDialogue} from "./DualButtonScriptDialogue";

const createDualButtonScriptDialogue = () => {
    return dualButtonScriptDialogue(
        'my.title',
        {
            name: 'my-top-button',
            text: 'my.top.button.text',
        },
        {
            name: 'my-bottom-button',
            text: 'my.bottom.button.text',
        }
    );
};

describe('ScriptDialogue', () => {
    it('lock player camera', async () => {
        const player = mockPlayer();

        await createDualButtonScriptDialogue().open({ player, lockPlayerCamera: true });

        expect(player.runCommand).toHaveBeenCalledTimes(4);
        expect(player.runCommand).toHaveBeenNthCalledWith(1,'inputpermission set Steve camera disabled');
        expect(player.runCommand).toHaveBeenNthCalledWith(2,`inputpermission set Steve movement disabled`);
        expect(player.runCommand).toHaveBeenNthCalledWith(3,`inputpermission set Steve camera enabled`);
        expect(player.runCommand).toHaveBeenNthCalledWith(4,`inputpermission set Steve movement enabled`);
    });

    it('does not lock player camera', async () => {
        const player = mockPlayer();

        await createDualButtonScriptDialogue().open({ player, lockPlayerCamera: false });

        expect(player.runCommand).not.toHaveBeenCalled();
    });

});
