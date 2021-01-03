import React from "react";
import { ParameterSet } from "./utils";

export function Button(props) {
    const parameters = new ParameterSet(props, "flg-Button");
    const onClick = parameters.pop("onClick", null);
    const children = parameters.pop("children", null);
    return <button onClick={onClick} {...parameters.remaining}>{children}</button>;
}
