import { type DelProps } from './del.props'
import { Post } from './post'

/** |**  http'del
  Send a http request with DELETE method
  @example
  ```yaml
    # DELETE http://localhost:3000/posts/1?method=check_existed
    - name: Delete a post
      http'del:
        url: /posts/1
        baseURL: http://localhost:3000  # !optional - Request base url
        query:                          # !optional - Request query string
          method: check_existed
        headers:                        # !optional - Request headers
          authorization: Bearer TOKEN
        timeout: 5000                   # !optional - Request timeout. Default is no timeout
      vars:                             # !optional - Global variable which store value after executed
        status: ${this.$.response.status}
  ```
*/
export class Del extends Post {
  method = 'delete'

  constructor(props: DelProps) {
    super(props)
  }
}
