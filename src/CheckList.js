import React from "react";
import { ParameterSet, ParameterError, useUniqueId } from "./utils";
import { CheckBox } from "./CheckBox";

export function CheckList(props) {

    const parameters = new ParameterSet(props, "flg-CheckList");
    const field = parameters.pop("field");
    const onChange = parameters.pop("onChange", null);
    const value = parameters.pop("value", []);

    if (!field.items) {
        throw new ParameterError(
            "CheckList expected a collection, or any other kind of field with an "
            + `'items' property containing another field; got ${field} instead`
        );
    }

    const selectedValueIds = new Set(
        Array.from(value, item => field.items.getValueId(item))
    );
    const values = field.items.getPossibleValues();

    const checkListId = useUniqueId("flg-CheckList-");

    function handleCheckChanged(e) {
        if (onChange) {
            const newValue = [];
            let index = 0;
            const checks = (
                e.target
                .closest(".flg-CheckList")
                .querySelectorAll(".flg-CheckList-check")
            );
            for (let check of checks) {
                if (check.checked) {
                    newValue.push(values[index]);
                }
                index++;
            }
            onChange({previousValue: value, newValue});
        }
    }

    return (
        <div {...parameters.remaining}>
            <ul className="flg-CheckList-list">
                {values.map(possibleValue => {
                    const valueId = field.items.getValueId(possibleValue);
                    const isSelected = selectedValueIds.has(valueId);
                    const checkBoxId = `${checkListId}-${valueId}`;
                    return (
                        <li
                            key={valueId}
                            className="flg-CheckList-item"
                            data-selected={isSelected}
                            data-value={valueId}>

                            <CheckBox
                                id={checkBoxId}
                                className="flg-CheckList-check"
                                value={isSelected}
                                onChange={handleCheckChanged}/>

                            <label className="flg-CheckList-label" htmlFor={checkBoxId}>
                                {field.items.getValueLabel(possibleValue)}
                            </label>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
