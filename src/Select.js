import React from "react";
import { ParameterError, ParameterSet } from "./utils";

export function Select(props) {
    const parameters = new ParameterSet(props, "flg-Select");
    const field = parameters.pop("field", null);
    const selectedValue = parameters.pop("value", null);
    const selectedValueId = field ? field.getValueId(selectedValue) : selectedValue;
    const onChange = parameters.pop("onChange", null);
    const useUndefinedForBlank = parameters.pop("useUndefinedForBlank", false);
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

    function onSelectChange(e) {
        if (onChange) {
            onChange({
                field,
                previousValue: selectedValue,
                newValue: possibleValues[e.target.selectedIndex]
            });
        }
    }

    return (
        <select value={selectedValueId} onChange={onSelectChange} {...parameters.remaining}>
            {possibleValues.map(possibleValue => {
                const valueId = field.getValueId(possibleValue);
                return (
                    <option key={valueId} value={valueId}>
                        {field ? field.getValueLabel(possibleValue) : possibleValue}
                    </option>
                );
            })}
        </select>
    );
}
