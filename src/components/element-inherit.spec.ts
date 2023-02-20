import { Testing } from 'src/testing'
import { ElementProxy } from './element-proxy'
import { Scene } from './scene/scene'

let scene: ElementProxy<Scene>

beforeEach(async () => {
  await Testing.reset()
})

afterEach(async () => {
  await scene.dispose()
})

test('Should run echo element', async () => {
  scene = await Testing.createElementProxy(Scene, {
    content: `
- ->: school
  template:
    schoolName: School 1

- ->: class
  <-: school
  template:
    className: Class 1

- ->: student
  template:
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
