import * as schema from "@filigrana/schema";
import { TextInput } from "./TextInput";
import { NumberInput } from "./NumberInput";
import { CheckBox } from "./CheckBox";
import { Select } from "./Select";

// Used by tables and other UI elements to determine the UI component to use when
// displaying a read only version of the field
export const display = schema.declareHint("display");

// Used by forms to determine the UI component that should be used to edit the field
// (f. eg. choose between a text input, a textarea or a rich text editor)
export const formControl = schema.declareHint("formControl");

schema.Text.prototype[formControl] = TextInput;
schema.Number.prototype[formControl] = NumberInput;
schema.Boolean.prototype[formControl] = CheckBox;
schema.Enum.prototype[formControl] = Select;

// Used to display a tooltip for the field on forms, tables and other UI elements
export const tooltip = schema.declareHint("display");

// Used by filter sets to allow fields to implement custom filtering logic
export const testFilter = schema.declareHint("testFilter");
