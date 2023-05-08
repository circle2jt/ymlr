import { LevelNumber } from './level-number'

export abstract class Level {
  constructor(protected level: LevelNumber) { }

  abstract format(msg: string): string

  is(level: LevelNumber) {
    return level === LevelNumber.silent ? (this.level === level) : this.level <= level
  }
}
