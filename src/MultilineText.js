import React from "react";

export function MultilineText(props) {
    var lines = (props.value || "").split("\n");
    return (
        <>
            {lines.map((line, index) => <div key={index}>{line}</div>)}
        </>
    );
}