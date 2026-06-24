import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'new_games')
const target = path.join(root, 'public', 'games', 'golden-bear')

await rm(target, { recursive: true, force: true })
await mkdir(path.join(target, 'assets'), { recursive: true })
await mkdir(path.join(target, 'sounds'), { recursive: true })
await mkdir(path.join(target, 'js'), { recursive: true })

await cp(path.join(source, 'index1.html'), path.join(target, 'index.html'))
await cp(path.join(source, 'styles.css'), path.join(target, 'styles.css'))

for (const file of await readdir(path.join(source, 'js'))) {
  if (file.endsWith('.mjs') && file !== 'round.mjs') {
    await cp(path.join(source, 'js', file), path.join(target, 'js', file))
  }
}

for (const file of await readdir(path.join(source, 'assets'))) {
  if (file.endsWith('.webp')) await cp(path.join(source, 'assets', file), path.join(target, 'assets', file))
}

for (const file of await readdir(path.join(source, 'sounds'))) {
  if (/\.(ogg|wav)$/.test(file)) await cp(path.join(source, 'sounds', file), path.join(target, 'sounds', file))
}

console.log(`Golden Bear sincronizado en ${path.relative(root, target)}`)
