import React, { useState } from "react";
import { ParameterSet } from "./utils";
import { display } from "./hints";
import { SelectionContainer, useSelectable } from "./selection";
import { LoadingMessage } from "./LoadingMessage";
import { SVG } from "./SVG";
import { useObjectSet } from "./utils";
import { resourceURL } from "./resources";

export function Table(props) {

    const parameters = new ParameterSet(props, 'flg-Table');
    const model = parameters.pop('model');
    const schema = parameters.pop('schema', null) || model.schema;
    const HeadingComponent = parameters.pop('headingComponent', TableHeading);
    const RowComponent = parameters.pop('rowComponent', TableRow);
    const searchQuery = parameters.pop('searchQuery', '');
    const sortable = parameters.pop('sortable', true);
    const initialOrder = parameters.pop('order', null);
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

    const [order, setOrder] = useState(initialOrder);

    const objects = useObjectSet(source, {searchQuery, order});
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
                        {Array.from(schema.fields(), field => {
                            let sortDirection = 0;
                            if (order) {
                                if (field.name == order) {
                                    sortDirection = 'asc';
                                }
                                else if ('-' + field.name == order) {
                                    sortDirection = 'desc';
                                }
                            }
                            return (
                                <HeadingComponent
                                    key={field.name}
                                    field={field}
                                    sortable={sortable}
                                    sortDirection={sortDirection}
                                    onSortingRequested={setOrder}/>
                            );
                        })}
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
    const sortable = parameters.pop('sortable', true);
    const sortDirection = parameters.pop('sortDirection', null);
    const onSortingRequested = parameters.pop('onSortingRequested', null);

    const extraParameters = {};

    if (sortDirection) {
        extraParameters['data-sorted'] = sortDirection;
    }

    if (sortable) {
        parameters.appendClassName('sortable');
    }

    let sortDirectionIcon;
    if (sortDirection) {
        const iconURL = resourceURL('@filigrana/ui', `icons/${sortDirection}.svg`);
        sortDirectionIcon = (
            <SVG className="column-sort-direction" src={iconURL}/>
        );
    }
    else {
        sortDirectionIcon = null;
    }

    function handleClicked(e) {
        if (sortable && onSortingRequested) {
            onSortingRequested(
                (sortDirection == 'asc' ? '-' : '') + field.name
            );
        }
    }

    return (
        <th
            data-column={field.name}
            data-type={field.constructor.typeNames}
            {...parameters.remaining}
            {...extraParameters}
            onClick={handleClicked}>
            <div className="header-content">
                <span className="column-label">{field.label}</span>
                {sortDirectionIcon}
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

                let cellContent;
                const value = instance[field.name];

                if (field[display]) {
                    const Display = field[display];
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
                        data-type={field.constructor.typeNames}>
                        {cellContent}
                    </td>
                );
            })}
        </tr>
    );
}
