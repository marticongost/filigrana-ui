import React, { useState } from "react";
import { ParameterSet } from "./utils";
import { Field } from "@filigrana/schema";
import { ObjectStore, ObjectStoreError } from "@filigrana/schema";
import { SelectionContainer, useSelectable } from "./selection";
import { LoadingMessage } from "./LoadingMessage";

export function Table(props) {

    const parameters = new ParameterSet(props, 'flg-Table');
    const model = parameters.pop('model');
    const schema = parameters.pop('schema', null) || model.schema;
    const HeadingComponent = parameters.pop('headingComponent', TableHeading);
    const RowComponent = parameters.pop('rowComponent', TableRow);
    let rowKey = parameters.pop('rowKey', null);

    if (!schema.hasFields()) {
        throw new Error(
            `Table expected a schema with 1+ fields; ${schema} is empty`
        );
    }

    let objects = parameters.pop('objects', model.objects);
    if (objects instanceof ObjectStore) {
        objects = objects.list();
    }

    const [resolvedObjects, setResolvedObjects] = useState(objects);
    const [errorMessage, setErrorMessage] = useState(null);
    const resolving = resolvedObjects instanceof Promise;

    if (resolving) {
        objects
            .then(setResolvedObjects)
            .catch(error => {
                if (error instanceof ObjectStoreError) {
                    setErrorMessage(error.toString());
                }
                else {
                    throw error;
                }
            });
    }

    if (!rowKey) {
        for (let field of schema.fields()) {
            rowKey = (instance) => instance.getValue(field.name);
            break;
        }
    }

    let content;

    if (errorMessage) {
        status = 'error';
        content = <div className="error-message">{errorMessage}</div>;
    }
    else if (resolvedObjects instanceof Promise) {
        status = 'loading';
        content = <LoadingMessage/>;
    }
    else {
        status = 'loaded';
        content = (
            <table>
                <thead>
                    <tr>
                        {Array.from(schema.fields(), field =>
                            <HeadingComponent key={field.name} field={field}/>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {resolvedObjects.map(instance =>
                        <RowComponent
                            key={rowKey(instance)}
                            schema={schema}
                            instance={instance} />
                    )}
                </tbody>
            </table>
        );
    }

    return (
        <SelectionContainer
            selectionItems={resolving ? [] : resolvedObjects}
            selectionKey={rowKey}
            data-status={status}
            {...parameters.remaining}>
            {content}
        </SelectionContainer>
    );
}

export function TableHeading(props) {

    const parameters = new ParameterSet(props, 'flg-TableHeading');
    const field = parameters.pop('field');

    return (
        <th {...parameters.remaining}>
            <div className="header-content">
                {field.label}
            </div>
        </th>
    );
}

export function TableRow(props) {

    const parameters = new ParameterSet(props, 'flg-TableRow');
    const schema = parameters.pop('schema');
    const instance = parameters.pop('instance');

    const [ref, isSelected] = useSelectable(instance);

    if (!schema) {
        throw new Error('TableRow expected a "schema" property');
    }

    return (
        <tr ref={ref} {...parameters.remaining}>
            {Array.from(schema.fields(), field => {

                const typeNames = [];
                let fieldClass = field.constructor;
                while (fieldClass !== Object && fieldClass !== Field && fieldClass.name) {
                    typeNames.unshift(fieldClass.name);
                    fieldClass = fieldClass.__proto__;
                }

                let cellContent;
                const value = props.instance[field.name];

                if (field.display) {
                    const Display = field.display;
                    cellContent = (
                        <Display
                            instance={props.instance}
                            field={field} value={value} />
                    );
                }
                else {
                    cellContent = props.instance.getValue(field.name);
                }

                return (
                    <td
                        key={field.name}
                        data-column={field.name}
                        data-type={typeNames.join(" ")}>
                        {cellContent}
                    </td>
                );
            })}
        </tr>
    );
}
