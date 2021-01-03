import React, { useRef } from "react";
import { ParameterError, ParameterSet } from "./utils";
import { Dropdown } from "./Dropdown";

let selectCount = 0;

export function Select(props) {

    const parameters = new ParameterSet(props, "flg-Select");
    const field = parameters.pop("field", null);
    const selectedValue = parameters.pop("value", null);
    const selectedValueId = field ? field.getValueId(selectedValue) : selectedValue;
    const onChange = parameters.pop("onChange", null);
    const nameRef = useRef(null);
    const dropdownController = {};

    if (!nameRef.current) {
        nameRef.current = `flg-Select-${selectCount++}`;
    }

    let ItemComponent = parameters.pop("Item", null);
    let possibleValues = parameters.pop("possibleValues", null);

    if (possibleValues === null) {

        if (field) {
            possibleValues = field.getPossibleValues();
        }

        if (!possibleValues) {
            throw new ParameterError(
                "<Select> requires either an explicit 'possibleValues' parameters or "
                + "a 'field' parameter implementing Field.getPossibleValues()"
            );
        }
    }

    if (field && !field.required) {
        possibleValues.unshift(null);
    }

    if (!ItemComponent) {
        ItemComponent = props => field ? field.getValueLabel(props.value) : props.value;
    }

    function selectElement(element) {
        if (onChange) {
            const index = Number(element.getAttribute("data-index"));
            onChange({
                field,
                previousValue: selectedValue,
                newValue: possibleValues[index]
            });
        }
    }

    function handleSelectionChanged(e) {
        dropdownController.close();
        selectElement(e.target.parentNode.parentNode);
    }

    function handleKeyDown(e) {

        let nextSelection = null;
        const selectedItem = (
            e.target.parentNode.querySelector(".flg-Select-item[data-selected='true']")
        );

        if (e.key == "ArrowDown") {
            if (selectedItem) {
                let node = selectedItem.nextSibling;
                while (node) {
                    if (node.classList && node.classList.contains("flg-Select-item")) {
                        nextSelection = node;
                        break;
                    }
                    node = node.nextSibling;
                }
            }
            else {
                nextSelection = e.target.parentNode.querySelector(".flg-Select-item");
            }
        }
        else if (e.key == "ArrowUp") {
            if (selectedItem) {
                let node = selectedItem.previousSibling;
                while (node) {
                    if (node.classList && node.classList.contains("flg-Select-item")) {
                        nextSelection = node;
                        break;
                    }
                    node = node.previousSibling;
                }
            }
        }
        else if (e.key == "Home") {
            nextSelection = e.target.parentNode.querySelector(".flg-Select-item");
        }
        else if (e.key == "End") {
            nextSelection = e.target.parentNode.querySelector(".flg-Select-item:last-child");
        }

        if (nextSelection) {
            selectElement(nextSelection);
        }
    }

    return (
        <Dropdown
            buttonContent={field.getValueLabel(selectedValue)}
            controller={dropdownController}
            onKeyDown={handleKeyDown}
            {...parameters.remaining}>
            <ul className="flg-Select-list">
                {possibleValues.map((possibleValue, index) => {
                    const valueId = field.getValueId(possibleValue);
                    const isSelected = valueId == selectedValueId;
                    return (
                        <li
                            data-value={valueId}
                            data-selected={isSelected}
                            data-index={index}
                            key={valueId}
                            className="flg-Select-item">
                            <label className="flg-Select-item-label">
                                <input
                                    className="flg-Select-item-input"
                                    name={nameRef.current}
                                    type="radio"
                                    value={valueId}
                                    checked={isSelected}
                                    onChange={handleSelectionChanged}
                                    tabIndex="-1"/>
                                <ItemComponent value={possibleValue}/>
                            </label>
                        </li>
                    );
                })}
            </ul>
        </Dropdown>
    );
}
