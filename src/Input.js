import React from "react";
import { ParameterSet } from "./utils";

export function Input(props) {
    const parameters = new ParameterSet(props);
    const type = parameters.pop("type");
    const onChange = parameters.pop("onChange", null);
    let value = parameters.pop("value", "");

    if (value === null || value === undefined) {
        value = "";
    }

    return <input type={type} {...parameters.remaining} value={value} onChange={onChange}/>;
}
