import { Testing } from 'src/testing'
import { type ElementProxy } from './element-proxy'
import { Scene } from './scene/scene'

let scene: ElementProxy<Scene>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await scene.dispose()
})

test('Should ref "id" props to element proxy in $vars', async () => {
  scene = await Testing.createElementProxy(Scene, {
    content: `
- id: echo1
  echo: Hello world
`
  })
  const rs = await scene.exec()
  const [echo1] = rs
  expect(echo1).toBe(scene.element.localVars.echo1)
})

test('Should run echo element', async () => {
  scene = await Testing.createElementProxy(Scene, {
    content: `
- ->: school
  ;props:
    schoolName: School 1

- ->: class
  <-: school
  ;props:
    className: Class 1

- ->: student
  ;props:
    name: Person

- <-: [class, school, student]
  echo:
    content: \${this.$.schoolName}/\${this.$.className}/\${this.$.name}

- <-: [class, school]
  echo:
    content: \${this.$.schoolName}/\${this.$.className}/\${this.$.name}
    name: Person 1

- <-: student
  echo:
    content: \${this.$.schoolName}/\${this.$.className}/\${this.$.name}
`
  })
  const rs = await scene.exec()
  const [classSchoolStudent, classSchool, student] = rs
  expect(classSchoolStudent.result).toEqual('School 1/Class 1/Person')
  expect(classSchool.result).toEqual('School 1/Class 1/Person 1')
  expect(student.result).toEqual('undefined/undefined/Person')
})
