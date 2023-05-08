import { LevelNumber } from './level-number'

export abstract class Level {
  constructor(protected level: LevelNumber) { }

  abstract format(msg: string): string

  is(level: LevelNumber) {
    return this.level === LevelNumber.silent ? false : this.level <= level
  }
}
