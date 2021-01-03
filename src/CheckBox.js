import React from "react";
import { ParameterSet } from "./utils";

export function CheckBox(props) {

    const parameters = new ParameterSet(props, "flg-CheckBox");
    const onChange = parameters.pop("onChange", null);
    const value = parameters.pop("value", false);

    return (
        <input
            type="checkbox"
            checked={value}
            onChange={onChange}
            {...parameters.remaining}/>
    );
}
