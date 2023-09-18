import { Post } from './post'
import { type PutProps } from './put.props'

/** |**  http'put
  Send a http request with PUT method
  @example
  Update data to API then store value in `vars.posts`
  ```yaml
    # PUT http://localhost:3000/posts/ID?category=users
    - name: Update a post
      http'put:
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
    # PUT http://localhost:3000/upload/ID_UPLOADER_TO_REPLACE
    - name: Upload and update data
      http'put:
        baseURL: http://localhost:3000
        url: /upload/ID_UPLOADER_TO_REPLACE
        headers:
          authorization: Bearer TOKEN
        type: multipart
        body: {
          "category": "avatar updated",
          "file": { # File upload must includes path of file, name is optional
            "path": "/tmp/new_my_avatar.jpg",
            "name": "thanh_avatar"
          }
        }
      vars:
        status: ${this.response.status}
  ```
*/
export class Put extends Post {
  method = 'put'

  constructor(props: PutProps) {
    super(props)
  }
}
