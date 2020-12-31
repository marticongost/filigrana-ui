import { Model } from "@filigrana/schema";
import { testFilter } from "./hints";

export class FilterSet extends Model {

    *filterObjects(objectSet) {
        for (let object of objectSet) {
            if (this.testObject(object)) {
                yield object;
            }
        }
    }

    testObject(object) {
        for (let field of this.constructor.schema.fields()) {
            if (this.skipFilter(field)) {
                continue;
            }
            if (!this.testFilter(field, object)) {
                return false;
            }
        }
        return true;
    }

    skipFilter(field) {
        return this.getValue(field.name) === undefined;
    }

    testFilter(field, object) {

        // Fields can use the "testFilter" hint to provide custom matching logic
        if (field[testFilter]) {
            return field[testFilter](this, object);
        }

        // Fields with no value specified are assumed to pass
        const filterValue = this.getValue(field.name);
        if (field.valueIsBlank(filterValue)) {
            return true;
        }

        // Otherwise, test for equality
        return field.valueIsEqual(object.getValue(field.name), filterValue);
    }

    static fromSchema(schema) {
        const cls = class FilterSet extends this {};
        const fields = Array.from(
            schema.fields(),
            (field) => field.copy({required: false})
        );
        cls.defineSchema({fields});
        return cls;
    }
}
