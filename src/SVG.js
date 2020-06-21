import React, { useState, useEffect } from "react";

export function SVG(props) {

    const {src, ...attr} = props;
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

    return <div className="flg-SVG" {...attr} dangerouslySetInnerHTML={svg}/>;
}
