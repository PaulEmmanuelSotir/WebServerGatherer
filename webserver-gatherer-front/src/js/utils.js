/** notNullNorUndefined
 *  Small helper function wich may be used to test for a value to be non-null and not 'undefined'. (May be usefull for easier conditions in vue templates)
 * May take an additional 'type' argument if type check on value is also needed ('null' by default, ie, no additional type check)
 * NOTE: be aware that "type" argument is checked using "typeof val" (not using es6 class "instanceof")
 **/
export function notNullNorUndefined(val, type = null) {
  const type_check = type !== null ? typeof val === type : true;
  return typeof val !== "undefined" && val !== null && type_check;
}

/** Clones a given ES6 class instance into another object and return it.
 * Relies on "Object.assign", "Object.create" and "Object.getPrototypeOf" functions.
 * NOTE: Implementation inspired from StackOverflow thread "How to clone a javascript ES6 class instance" https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance (A proof, if needed, that JS sucks a lot)
 */
export function cloneObj(source) {
  return Object.assign(Object.create(Object.getPrototypeOf(source)), source);
}

export const messageTypes = {
  ERROR: "error",
  SUCCESS: "success"
};

export class IDGenerator {
  constructor(init = 0) {
    this.currentId = init;
  }

  getNewId() {
    return `${process.pid}-${this.currentId++}`;
  }

  reset(init = 0) {
    this.currentId = init;
  }
}
