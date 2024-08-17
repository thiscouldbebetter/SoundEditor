"use strict";
class NumberHelper {
    static trimNumberToMax(numberToTrim, max) {
        var value = numberToTrim;
        if (value < 0) {
            value = 0;
        }
        else if (value >= max) {
            value = max;
        }
        return value;
    }
}
