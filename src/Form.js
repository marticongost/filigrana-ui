import React, { useState, useRef } from "react";
import { ParameterSet } from "./utils";
import { formControl, formChoiceControl } from "./hints";
import { Tooltip } from "./Tooltip";
import { tooltip } from "./hints";

let fieldCount = 0;

export function Form(props) {

    const parameters = new ParameterSet(props, "flg-Form");
    const initialObject = parameters.pop("object");
    const schema = initialObject.constructor.schema;
    const FormFieldComponent = parameters.pop("formFieldComponent", FormField);
    const onChange = parameters.pop("onChange", null);

    const [object, setObject] = useState(initialObject);

    function handleFieldChanged(e) {
        const newObject = object.copy();
        newObject.setValue(e.field.name, e.newValue);
        setObject(newObject);
        if (onChange) {
            onChange({previousObject: object, newObject});
        }
    }

    return (
        <form {...parameters.remaining}>
            {Array.from(
                schema.fields(),
                field => (
                    <FormFieldComponent
                        key={field.name}
                        object={object}
                        field={field}
                        onChange={handleFieldChanged}/>
                )
            )}
        </form>
    );
}

export function FormField(props) {

    const parameters = new ParameterSet(props, "flg-FormField");
    const object = parameters.pop("object");
    const field = parameters.pop("field");
    const value = object.getValue(field.name);
    const onChange = parameters.pop("onChange", null);
    const FormControlComponent = (
        field.requireHint(field.choices ? formChoiceControl : formControl)
    );

    const idRef = useRef(null);

    // Grant each form control a stable ID
    if (!idRef.current) {
        fieldCount++;
        idRef.current = "flg-form-control-" + fieldCount;
    }

    return (
        <div
            {...parameters.remaining}
            data-field={field.name}
            data-type={field.constructor.typeNames}>
            <label className="flg-FormField-label" htmlFor={idRef.current}>
                {field.label}
                {field[tooltip] ? <Tooltip>{field[tooltip]}</Tooltip> : null}
            </label>
            <FormControlComponent
                id={idRef.current}
                className="flg-FormField-control"
                field={field}
                value={value}
                onChange={onChange}/>
        </div>
    );
}
