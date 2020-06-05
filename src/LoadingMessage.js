import React from "react";
import { ParameterSet } from "./utils";

export function LoadingMessage(props) {

    const parameters = new ParameterSet(props, 'flg-LoadingMessage');
    const message = parameters.pop('message', 'Loading...');

    return (
        <div {...parameters.remaining}>
            {message}
        </div>
    );
}
