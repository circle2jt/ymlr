import chalk from 'chalk'
import ColorfulStyle from './colorful-style'
import JsonStyle from './json-style'

export class StyleFactory {
  static Instance = this.GetStyle('colorful')

  static SetLogStyle(name?: 'color0' | 'color16' | 'color256' | 'color16M' | 'json') {
    this.Instance = this.GetStyle(name)
  }

  private static GetStyle(name?: string) {
    switch (name) {
      case 'json':
        chalk.level = 0
        return new JsonStyle()
      case 'color0':
        chalk.level = 0
        return new ColorfulStyle()
      case 'color256':
        chalk.level = 2
        return new ColorfulStyle()
      case 'color16M':
        chalk.level = 3
        return new ColorfulStyle()
      default:
        chalk.level = 1
        return new ColorfulStyle()
    }
  }
}
