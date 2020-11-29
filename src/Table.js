import React, { useState } from "react";
import { ParameterSet } from "./utils";
import { display } from "./hints";
import { SelectionContainer, useSelectable } from "./selection";
import { LoadingMessage } from "./LoadingMessage";
import { SVG } from "./SVG";
import { useObjectSet } from "./utils";
import { resourceURL } from "./resources";

function makeColumns(fields, callback) {
    let previousGroup = null;
    let list = [];
    for (let field of fields) {
        list.push(callback(field, list.length, field.group != previousGroup));
        previousGroup = field.group;
    }
    return list;
}

export function Table(props) {

    const parameters = new ParameterSet(props, 'flg-Table');
    const model = parameters.pop('model');
    const schema = parameters.pop('schema', null) || model.schema;
    const HeadingGroupComponent = parameters.pop('groupComponent', TableHeadingsGroup);
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
        let previousGroup = null;

        function makeHeading(field, columnIndex, isGroupStart) {
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
                    key={"field-" + field.name}
                    field={field}
                    sortable={sortable}
                    sortDirection={sortDirection}
                    onSortingRequested={setOrder}
                    columnIndex={columnIndex}
                    isGroupStart={isGroupStart}/>
            );
        }

        // Main headings row: fields with no group (with rowspan=2) and group headings
        // (with colspan=group size)
        const renderedGroups = new Set();
        const headingsMainRow = (
            <tr>
                {makeColumns(schema.fields(), (field, columnIndex, isGroupStart) => {
                    if (field.group) {
                        if (renderedGroups.has(field.group)) {
                            return null;
                        }
                        renderedGroups.add(field.group);
                        return (
                            <HeadingGroupComponent
                                key={"group-" + field.group.name}
                                group={field.group}
                                isGroupStart={isGroupStart}/>
                        );
                    }
                    return makeHeading(field, columnIndex, isGroupStart);
                })}
            </tr>
        );

        // Secondary headings row: only fields belonging to a group
        let headingsSecondaryRow = null;
        if (schema.grouped) {
            headingsSecondaryRow = (
                <tr>
                    {makeColumns(schema.fields(), (field, columnIndex, isGroupStart) => {
                        return field.group ? makeHeading(field, columnIndex, isGroupStart) : null;
                    })}
                </tr>
            );
        }

        content = (
            <table>
                <thead>
                    {headingsMainRow}
                    {headingsSecondaryRow}
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

export function TableHeadingsGroup(props) {

    const parameters = new ParameterSet(props, 'flg-TableHeadingsGroup');
    const group = parameters.pop('group');
    const isGroupStart = parameters.pop('isGroupStart', false);

    if (isGroupStart) {
        parameters.appendClassName('group-start');
    }

    return (
        <th
            data-group={group.name}
            colSpan={group.length}
            {...parameters.remaining}>
            <div className="header-content">
                <span className="column-label">{group.label}</span>
            </div>
        </th>
    );
}

export function TableHeading(props) {

    const parameters = new ParameterSet(props, 'flg-TableHeading');
    const field = parameters.pop('field');
    const sortable = parameters.pop('sortable', true);
    const sortDirection = parameters.pop('sortDirection', null);
    const onSortingRequested = parameters.pop('onSortingRequested', null);
    const columnIndex = parameters.pop('columnIndex', null);
    const isGroupStart = parameters.pop('isGroupStart', false);

    const extraParameters = {'data-index': columnIndex};

    if (sortDirection) {
        extraParameters['data-sorted'] = sortDirection;
    }

    if (sortable) {
        parameters.appendClassName('sortable');
    }

    if (isGroupStart) {
        parameters.appendClassName('group-start');
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

    // If the column belongs to a group, indicate it; otherwise, if the table is
    // grouped, span the main and secondary heading rows.
    if (field.group) {
        extraParameters["data-group"] = field.group.name;
    }
    else if (field.owner.grouped) {
        extraParameters.rowSpan = 2;
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
            {makeColumns(schema.fields(), (field, columnIndex, isGroupStart) => {

                let cellContent;
                const value = instance.getValue(field.name);

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
                        className={isGroupStart ? 'group-start' : null}
                        data-column={field.name}
                        data-index={columnIndex}
                        data-type={field.constructor.typeNames}>
                        {cellContent}
                    </td>
                );
            })}
        </tr>
    );
}
