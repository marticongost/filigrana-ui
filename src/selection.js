import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import Enum from "@filigrana/enum";
import { ParameterSet } from "./utils";

export const SelectionContext = createContext(null);

export class SelectionType extends Enum {

    static get NONE() {
        return this._option('NONE');
    }

    static get SINGLE() {
        return this._option('SINGLE');
    }

    static get MULTIPLE() {
        return this._option('MULTIPLE');
    }
}

export class SelectionBehavior extends Enum {

    static get REPLACE() {
        return this._option('REPLACE');
    }

    static get TOGGLE() {
        return this._option('TOGGLE');
    }
}

const ITEMS = Symbol('ITEMS');
const GET_KEY = Symbol('GET_KEY');
const NODES = Symbol('NODES');
const FIRST_NODE = Symbol('FIRST_NODE');
const LAST_NODE = Symbol('FIRST_NODE');
const SELECTED_KEYS = Symbol('SELECTED_KEYS');
const RANGE_START = Symbol('RANGE_START');
const RANGE_END = Symbol('RANGE_END');
const TYPE = Symbol('TYPE');
const BEHAVIOR = Symbol('BEHAVIOR');
const REGISTER_SELECTABLE = Symbol('REGISTER_SELECTABLE');
const SET_SELECTED = Symbol('SET_SELECTED');

export class Selection {

    constructor(parameters) {

        if (!parameters) {
            throw new Error(
                'SelectionContainer expected a "parameters" argument'
            )
        }

        if (!parameters.items) {
            throw new Error(
                'SelectionContainer expected an "items" property'
            );
        }

        if (!parameters.getKey) {
            throw new Error(
                'SelectionContainer expected a "getKey" callback parameter'
            );
        }

        this[ITEMS] = [];
        this[GET_KEY] = parameters.getKey;
        this[TYPE] = parameters.type || SelectionType.SINGLE;
        this[BEHAVIOR] = parameters.behavior || SelectionBehavior.REPLACE;
        this[NODES] = {};
        this[SELECTED_KEYS] = new Set();
        let index = 0;

        if (parameters.items) {
            for (let item of parameters.items) {
                this[ITEMS].push(item);
                const key = this[GET_KEY](item);
                const previousNode = this[LAST_NODE];
                const node = {item, index: index++, key, previousNode};
                if (previousNode) {
                    previousNode.nextNode = node;
                }
                else {
                    this[FIRST_NODE] = node;
                }
                this[LAST_NODE] = node;
                this[NODES][key] = node;
            }
        }

        this.onItemSelected = parameters.onItemSelected;
        this.onItemDeselected = parameters.onItemDeselected;
        this.onChanged = parameters.onChanged;
        this.onActivated = parameters.onActivated;
    }

    get type() {
        return this[TYPE];
    }

    get behavior() {
        return this[BEHAVIOR];
    }

    get items() {
        return Object.freeze(this[ITEMS]);
    }

    set items(value) {
        this[ITEMS] = value;
    }

    *inOriginalOrder() {
        for (let key in this[NODES]) {
            if (this[SELECTED_KEYS].has(key)) {
                yield this[NODES][key].item;
            }
        }
    }

    get length() {
        return this[SELECTED_KEYS].size;
    }

    *[Symbol.iterator]() {
        for (let key of this[SELECTED_KEYS]) {
            yield this[NODES][key].item;
        }
    }

    get firstSelectedItem() {
        for (let item of this) {
            return item;
        }
        return null;
    }

    [REGISTER_SELECTABLE](value, isSelected, stateSetter) {
        const key = this[GET_KEY](value);
        if (isSelected) {
            this[SELECTED_KEYS].add(key);
        }
        else {
            this[SELECTED_KEYS].delete(key);
        }
        this[NODES][key].stateSetter = stateSetter;
    }

    isSelected(value) {
        const key = this[GET_KEY](value);
        return this[SELECTED_KEYS].has(key);
    }

    [SET_SELECTED](node, selected) {

        if (selected) {
            this[SELECTED_KEYS].add(node.key);
        }
        else {
            this[SELECTED_KEYS].delete(node.key);
        }

        if (node.stateSetter) {
            node.stateSetter(selected);
        }

        if (selected) {
            if (this.onItemSelected) {
                this.onItemSelected(this, node.item);
            }
        }
        else {
            if (this.onItemDeselected) {
                this.onItemDeselected(this, node.item);
            }
        }
    }

    toggle(value, selected = undefined) {

        const isSelected = this.isSelected(value);

        if (selected === undefined) {
            selected = !isSelected;
        }
        else if (selected == isSelected) {
            return;
        }

        const key = this[GET_KEY](value);
        const node = this[NODES][key];
        this[SET_SELECTED](node, selected);
        this[RANGE_START] = this[RANGE_END] = node;

        if (this.onChanged) {
            this.onChanged(this);
        }
    }

    extendTo(value) {
        let node = this[RANGE_START] || this[FIRST_NODE];

        if (!node) {
            throw new Error("Can't call extendTo() on an empty set of items");
        }

        const end = this[NODES][this[GET_KEY](value)];

        if (!end) {
            throw new Error(
                `Can't extend selection; no item with key ${key} exists`
            );
        }

        if (node == end) {
            return;
        }

        this[RANGE_END] = end;

        let direction;
        if (end.index > start.index) {
            direction = 'nextNode';
        }
        else if (end.index < start.index) {
            direction = 'previousNode';
        }

        while (node && node != end) {
            if (!this[SELECTED_KEYS].has(node.key)) {
                this[SET_SELETED](node);
            }
            node = node[direction];
        }
    }

    replace(selectedItems) {
        const prevSelectedKeys = this[SELECTED_KEYS];
        const newSelectedKeys = new Set(Array.from(selectedItems, this.getKey));

        for (let key of prevSelectedKeys) {
            if (!newSelectedKeys.has(key)) {
                const node = this[NODES][key];
                this[SET_SELECTED](node, false);
            }
        }

        let first, last;

        for (let key of newSelectedKeys) {
            const node = this[NODES][key];

            if (!prevSelectedKeys.has(key)) {
                this[SET_SELECTED](node, true);
            }

            if (!first || node.index < first.index) {
                first = node;
            }

            if (!last || node.index > last.index) {
                last = node;
            }
        }

        this[RANGE_START] = first;
        this[RANGE_END] = last;

        if (this.onChanged) {
            this.onChanged(this);
        }
    }

    selectFirst(extend) {
        if (extend) {
        }
        else {
            const node = this[FIRST_NODE];
            this.replace(node ? [node.key] : []);
        }
    }

    selectLast(extend) {
        if (extend) {
        }
        else {
            const node = this[LAST_NODE];
            this.replace(node ? [node.key] : []);
        }
    }

    selectPrevious(extend) {
        if (this[RANGE_START]) {
            const prev = this[RANGE_END].previousNode;
            if (extend) {
                // Shrinking a downwards selection
                if (this[RANGE_END].index > this[RANGE_START].index) {
                    this[SET_SELECTED](this[RANGE_END], false);
                    this[RANGE_END] = prev;
                    if (this.onChanged) {
                        this.onChanged(this);
                    }
                }
                // Extending an upwards selection
                else if (prev) {
                    this[RANGE_END] = prev;
                    this[SET_SELECTED](prev, true);
                    if (this.onChanged) {
                        this.onChanged(this);
                    }
                }
            }
            else if (prev) {
                this.replace([prev.item]);
            }
        }
    }

    selectNext(extend) {
        if (this[RANGE_START]) {
            const next = this[RANGE_END].nextNode;
            if (extend) {
                // Shrinking an upwards selection
                if (this[RANGE_END].index < this[RANGE_START].index) {
                    this[SET_SELECTED](this[RANGE_END], false);
                    this[RANGE_END] = next;
                    if (this.onChanged) {
                        this.onChanged(this);
                    }
                }
                // Extending a downwards selection
                else if (next) {
                    this[RANGE_END] = next;
                    this[SET_SELECTED](next, true);
                    if (this.onChanged) {
                        this.onChanged(this);
                    }
                }
            }
            else if (next) {
                this[RANGE_START] = next;
                this[RANGE_END] = next;
                this.replace([next.item]);
            }
        }
    }

    selectAll() {
        this.replace(this.items);
    }

    clear() {
        this.replace([]);
    }
}

export function SelectionContainer(props) {

    const parameters = new ParameterSet(props, 'flg-SelectionContainer');
    const selectionItems = parameters.pop('selectionItems', null);
    const selectionKey = parameters.pop('selectionKey', null);
    const selectionType = parameters.pop('selectionType', null);
    const selectionBehavior = parameters.pop('selectionBehavior', null);
    const children = parameters.pop('children', null);

    const onItemSelected = parameters.pop('onItemSelected', null);
    const onItemDeselected = parameters.pop('onItemDeselected', null);
    const onSelectionChanged = parameters.pop('onSelectionChanged', null);
    const onSelectionActivated = parameters.pop('onSelectionActivated', null);

    let selection = useContext(SelectionContext);
    if (!selection) {
        selection = new Selection({
            items: selectionItems,
            getKey: selectionKey,
            type: selectionType,
            behavior: selectionBehavior,
            onItemSelected: onItemSelected,
            onItemDeselected: onItemDeselected,
            onChanged: onSelectionChanged,
            onActivated: onSelectionActivated
        });
    }

    function handleKeyDown(event) {

        if (selection.type == SelectionType.NONE) {
            return;
        }

        const extend = (
            event.shiftKey
            && selection.type == SelectionType.MULTIPLE
        );

        if (event.key == 'ArrowDown') {
            selection.selectNext(extend);
            event.preventDefault();
            event.stopPropagation();
        }
        else if (event.key == 'ArrowUp') {
            selection.selectPrevious(extend);
            event.preventDefault();
            event.stopPropagation();
        }
        else if (event.key == 'Home') {
            selection.selectFirst(extend);
            event.preventDefault();
            event.stopPropagation();
        }
        else if (event.key == 'End') {
            selection.selectLast(extend);
            event.preventDefault();
            event.stopPropagation();
        }
        else if (event.key == 'a' && event.ctrlKey) {
            if (event.shiftKey) {
                selection.clear();
            }
            else {
                selection.selectAll();
            }
            event.preventDefault();
            event.stopPropagation();
        }
    }

    return <SelectionContext.Provider value={selection}>
        <div
            onKeyDown={handleKeyDown}
            tabIndex="-1"
            {...parameters.remaining}>
            {children}
        </div>
    </SelectionContext.Provider>;
}

export function useSelectable(value) {

    const selection = useContext(SelectionContext);

    const ref = useRef();
    const [isSelected, setSelected] = useState(selection.isSelected(value));
    selection[REGISTER_SELECTABLE](value, isSelected, setSelected);

    function handleClick(event) {
        if (selection.type == SelectionType.SINGLE) {
            if (selection.behavior == SelectionBehavior.TOGGLE) {
                selection.toggle(value);
            }
            else {
                selection.replace([value]);
            }
        }
        else if (selection.type == SelectionType.MULTIPLE) {
            if (selection.behavior == SelectionBehavior.REPLACE) {
                if (event.ctrlKey) {
                    selection.toggle(value);
                }
                else if (event.shiftKey) {
                    selection.extendTo(value);
                }
                else {
                    selection.replace([value]);
                }
            }
            else if (selection.behavior == SelectionBehavior.TOGGLE) {
                if (event.shiftKey) {
                    selection.extendTo(value);
                }
                else {
                    selection.toggle(value);
                }
            }
        }
    }

    function handleDoubleClick(event) {
        selection.activate(value);
    }

    const selectedClassName = 'flg-selected';

    useEffect(
        () => {
            if (isSelected) {
                ref.current.classList.add(selectedClassName);
            }
            else {
                ref.current.classList.remove(selectedClassName);
            }
        },
        [isSelected]
    );

    useEffect(
        () => {
            ref.current.addEventListener('click', handleClick);
            ref.current.addEventListener('dblclick', handleDoubleClick);
            return () => {
                ref.current.removeEventListener('click', handleClick);
                ref.current.removeEventListener('dblclick', handleDoubleClick);
            };
        },
        []
    );

    return [ref, isSelected];
}
