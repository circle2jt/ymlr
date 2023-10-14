import { type PatchProps } from './patch.props'
import { Post } from './post'

/** |**  fetch'patch
  Send a http request with PATCH method
  @example
  Update apart of data to API then store value in `vars.posts`
  ```yaml
    # PATCH http://localhost:3000/posts/ID?category=users
    - name: Update a post
      fetch'patch:
        baseURL: http://localhost:3000
        url: /posts/ID
        query:
          category: users
        headers:
          authorization: Bearer TOKEN
        type: json                      # 'json' | 'form' | 'raw' | 'multipart' | 'text'
        timeout: 5000                   # !optional - Request timeout. Default is no timeout
        body: {
          "title": "My title",
          "description": "My description"
        }
        responseType: json              # 'json' | 'blob' | 'text' | 'buffer' | 'none'
      vars: newPost
  ```
  Upload file to server
  ```yaml
    # PATCH http://localhost:3000/upload/ID_UPLOADER_TO_REPLACE
    - name: Upload and update data
      fetch'patch:
        baseURL: http://localhost:3000
        url: /upload/ID_UPLOADER_TO_REPLACE
        headers:
          authorization: Bearer TOKEN
        type: multipart
        body: {
          "file": { # File upload must includes path of file, name is optional
            "path": "/tmp/new_my_avatar.jpg",
            "name": "thanh_avatar"
          }
        }
      vars:
        status: ${this.response.status}
  ```
*/
export class Patch extends Post {
  method = 'patch'

  constructor(props: PatchProps) {
    super(props)
  }
}
