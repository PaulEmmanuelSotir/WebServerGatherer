/** notNullNorUndefined
 *  Small helper function wich may be used to test for a value to be non-null and not 'undefined'. (May be usefull for easier conditions in vue templates)
 * May take an additional 'type' argument if type check on value is also needed ('null' by default, ie, no additional type check)
 **/
export function notNullNorUndefined(val, type = null) {
  const type_check = type !== null ? typeof val === type : true;
  return typeof val !== "undefined" && val !== null && type_check;
}
