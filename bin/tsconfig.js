const merge = require('lodash.merge')
const { join, resolve, relative } = require('path')
const { readFile, writeFile, readdirSync, writeFileSync, readFileSync, lstatSync } = require('fs')

const curDir = resolve('.')
let config = require(join(curDir, 'tsconfig.build.json'))
if (config.extends) {
  try {
    const base = require(join(curDir, config.extends))
    config = merge({}, base, config)
  } catch { }
}
const dist = join(curDir, config.compilerOptions.outDir)

function replacePathsInTypescript() {
  const map = {}
  for (const k in config.compilerOptions.paths) {
    map[k.replace('/*', '')] = join(dist, config.compilerOptions.paths[k][0].replace('/*', ''))
  }
  function handleFile(p, ps) {
    return new Promise((resolve, reject) => {
      const m = {}
      for (const k in map) {
        m[k] = relative(p, map[k]).replace(/\\/g, '/')
        if (!m[k].startsWith('../')) m[k] = (m[k] ? './' : '.') + m[k]
      }
      readFile(ps, (err, data) => {
        if (err) return reject(err)
        let cnt = data.toString()
        for (const k in m) {
          cnt = cnt.replace(new RegExp(`(((require\\()|(from ))['"\`])${k}`, 'g'), `$1${m[k]}`)
        }
        writeFile(ps, cnt, (err) => {
          if (err) return reject(err)
          resolve(p)
        })
      })
    })
  }

  const jobs = []

  function replace(p) {
    readdirSync(p).forEach(f => {
      if (f.includes('node_modules/')) return
      const ps = join(p, f)
      if (lstatSync(ps).isDirectory()) {
        replace(ps)
      } else if (f.endsWith('.js') || f.endsWith('.ts')) {
        jobs.push(handleFile(p, ps))
      }
    })
  }

  // Handle paths
  replace(resolve(dist))

  return Promise.all(jobs).then((ps) => {
    console.log(`Replaced to resolve ${ps.length} files`)
  }).catch(console.err)
}

function autoReplaceTagInThePublishing() {
  const packageJson = require(join(curDir, 'package.json'))
  const pattern = /\d+\.\d+\.\d+-(\w+)/
  const m = packageJson.version.match(pattern)
  let tag = 'latest'
  if (m) {
    if (m[1]) {
      tag = m[1]
    }
  }
  // replace publish config with tag
  writeFileSync(
    join(dist, 'package.json'),
    readFileSync(join(curDir, 'package.json')).toString().replace(`<PUBLISH.TAG>`, tag)
  )
}

(async () => {
  await replacePathsInTypescript()
  await autoReplaceTagInThePublishing()
})()