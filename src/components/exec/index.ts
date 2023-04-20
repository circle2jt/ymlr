export default () => require('./exec').Exec
/** |**  exec'js
  Execute a nodejs code
  @example
  Refers to "js" tag document
*/
export const js = () => require('../js').default
/** |**  exec'sh
  Execute a shell script
  @example
  Refers to "sh" tag document
*/
export const sh = () => require('../sh').default
