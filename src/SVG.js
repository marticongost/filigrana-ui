import React, { useState, useEffect } from "react";
import { ParameterSet } from "./utils";

export function SVG(props) {

    const parameters = new ParameterSet(props, "flg-SVG");
    const src = parameters.pop("src");
    const [svgContent, setSVGContent] = useState(null);
    let mounted;

    useEffect(
        () => {
            mounted = true;
            fetch(src)
                .then(response => response.text())
                .then(text => {
                    if (mounted) {
                        setSVGContent(text);
                    }
                });

            return () => mounted = false;
        },
        [src]
    );

    let svg = null;

    if (svgContent) {
        svg = {__html: svgContent};
    }

    return <div {...parameters.remaining} dangerouslySetInnerHTML={svg}/>;
}
