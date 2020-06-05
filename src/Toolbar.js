import React, { useState } from 'react';
import { SVG } from './SVG';
import { ParameterSet } from './utils';
import Enum from '@filigrana/enum';

export function Toolbar(props) {
    const parameters = new ParameterSet(props, 'flg-Toolbar');
    const actions = parameters.pop('actions', null) || [];
    const context = parameters.pop('context', null);
    const ButtonComponent = parameters.pop('buttonComponent', ToolbarButton);
    return (
        <div {...parameters.remaining}>
            {actions.map(
                action => <ButtonComponent
                            key={action.id}
                            action={action}
                            context={context}/>
            )}
        </div>
    );
}

export function ToolbarButton(props) {

    const parameters = new ParameterSet(props, 'flg-ToolbarButton');
    const action = parameters.pop('action', null);
    const context = parameters.pop('context', null) || {};
    const [working, setWorking] = useState(false);

    if (!action) {
        return null;
    }

    const status = action.getStatus(context);
    if (status == ActionStatus.HIDDEN) {
        return null;
    }

    const attr = {};
    if (status == ActionStatus.DISABLED || working) {
        attr.disabled = true;
    }

    function handleClick() {
        let result = action.execute(context);
        if (result instanceof Promise) {
            result.then(() => setWorking(false));
        }
    }

    return (
        <button
            data-action={action.id}
            onClick={handleClick}
            {...attr}
            {...parameters.remaining}>
            <SVG src={action.icon}/>
            <span>{action.label}</span>
        </button>
    );
}

const ID = Symbol('ID');
const LABEL = Symbol('LABEL');
const MIN = Symbol('MIN');
const MAX = Symbol('MAX');
const CALLBACK = Symbol('CALLBACK');
const ICONS_PATH = Symbol('ICONS_PATH');

export class Action {

    constructor(parameters) {

        this[ID] = parameters.id;
        this[LABEL] = parameters.label;
        this[MIN] = parameters.min;
        this[MAX] = parameters.max;
        this[CALLBACK] = parameters.callback;

        if (parameters.iconsPath) {
            this[ICONS_PATH] = parameters.iconsPath;
        }
    }

    get id() {
        return this[ID];
    }

    get label() {
        return this[LABEL];
    }

    get min() {
        return this[MIN];
    }

    get max() {
        return this[MAX];
    }

    get icon() {
        const path = this.iconsPath;
        if (path) {
            return `${path}/${this[ID]}.svg`;
        }
        return null;
    }

    get iconsPath() {
        return this[ICONS_PATH];
    }

    getStatus(context) {

        if (this.min) {
            if (!context.selection || context.selection.length < this.min) {
                return ActionStatus.DISABLED;
            }
        }

        if (this.max) {
            if (!context.selection || context.selection.length > this.max) {
                return ActionStatus.DISABLED;
            }
        }

        return ActionStatus.ENABLED;
    }

    execute(context) {
        if (this[CALLBACK]) {
            this[CALLBACK](context);
        }
    }
}

export class ActionStatus extends Enum {

    /**
     * Indicates that the action should not be displayed.
     */
    static get HIDDEN() {
        return this._option('HIDDEN');
    }

    /**
     * Indicates that the action should be displayed, but not actionable.
     */
    static get DISABLED() {
        return this._option('DISABLED');
    }

    /**
     * Indicates that the action should be displayed and actionable.
     */
    static get ENABLED() {
        return this._option('ENABLED');
    }
}
