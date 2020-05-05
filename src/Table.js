import React, { useState } from "react";
import { mergeClassName } from "./utils";
import { Field } from "@filigrana/schema";
import { ObjectStore, ObjectStoreError } from "@filigrana/schema";
import { SelectionContainer, useSelectable } from "./selection";

export function Table(props) {

    let {
        className,
        model,
        schema,
        objects,
        headingComponent,
        rowComponent,
        rowKey,
        ...parentProps
    } = props;

    let status;
    let content;

    if (!model) {
        throw new Error('Table expected a "model" property');
    }

    if (!schema) {
        schema = model.schema;
    }

    if (!schema.hasFields()) {
        throw new Error(
            `Table expected a schema with 1+ fields; ${schema} is empty`
        );
    }

    if (!objects) {
        objects = model.objects;
    }

    if (!objects) {
        throw new Error(
            'Table expected a "data" property or a model with an object store'
        );
    }

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

    if (errorMessage) {
        status = 'error';
        content = <div className="error-message">{errorMessage}</div>;
    }
    else if (resolvedObjects instanceof Promise) {
        status = 'loading';
        content = <div className="loading-message">Cargando...</div>;
    }
    else {
        const HeadingComponent = headingComponent || TableHeading;
        const RowComponent = rowComponent || TableRow;

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
            className={mergeClassName('Table', className)}
            selectionItems={resolving ? [] : resolvedObjects}
            selectionKey={rowKey}
            data-status={status}
            {...parentProps}>
            {content}
        </SelectionContainer>
    );
}

export function TableHeading(props) {

    const {className, field, ...attr} = props;

    if (!field) {
        throw new Error('TableHeading expected a "field" property');
    }

    return (
        <th className={mergeClassName('TableHeading', className)} {...attr}>
            <div className="header-content">
                {props.field.label}
            </div>
        </th>
    );
}

export function TableRow(props) {

    const {className, schema, instance, ...attr} = props;
    const [ref, isSelected] = useSelectable(instance);

    if (!schema) {
        throw new Error('TableRow expected a "schema" property');
    }

    return (
        <tr
            ref={ref}
            className={mergeClassName('TableRow', className)}
            {...attr}>
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
                    cellContent = <Display instance={props.instance} field={field} value={value} />;
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
