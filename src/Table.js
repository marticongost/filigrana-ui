import React from "react";
import { ParameterSet } from "./utils";
import { Field } from "@filigrana/schema";
import { SelectionContainer, useSelectable } from "./selection";
import { LoadingMessage } from "./LoadingMessage";
import { useObjectSet } from "./utils";

export function Table(props) {

    const parameters = new ParameterSet(props, 'flg-Table');
    const model = parameters.pop('model');
    const schema = parameters.pop('schema', null) || model.schema;
    const HeadingComponent = parameters.pop('headingComponent', TableHeading);
    const RowComponent = parameters.pop('rowComponent', TableRow);
    const searchQuery = parameters.pop('searchQuery', '');
    const source = parameters.pop('objects', model.objects);

    if (!schema.hasFields()) {
        throw new Error(
            `Table expected a schema with 1+ fields; ${schema} is empty`
        );
    }

    let rowKey = parameters.pop('rowKey', null);
    if (!rowKey) {
        for (let field of schema.fields()) {
            rowKey = (instance) => instance.getValue(field.name);
            break;
        }
    }

    const objects = useObjectSet(source, {searchQuery});
    let content;

    if (!objects) {
        status = 'loading';
        content = <LoadingMessage/>;
    }
    else if (objects instanceof Error) {
        if (error instanceof ObjectStoreError) {
            status = 'error';
            content = <div className="error-message">{error.toString()}</div>;
        }
        else {
            throw error;
        }
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
                    {objects.map(instance =>
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
            selectionItems={objects instanceof Array ? objects : []}
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
                const value = instance[field.name];

                if (field.display) {
                    const Display = field.display;
                    cellContent = (
                        <Display
                            instance={instance}
                            field={field}
                            value={value} />
                    );
                }
                else {
                    cellContent = instance.getValueLabel(field.name);
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
