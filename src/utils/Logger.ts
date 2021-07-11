import * as fs from 'fs'

export class Logger {
  private filesystem
  private loggerName
  private loggerFile
  private jobName

  constructor(loggerFile: string, loggerName: string, jobName: string) {
    this.filesystem = fs
    this.loggerName = loggerName
    this.loggerFile = loggerFile
    this.jobName = jobName
    this.createFile()
  }

  createFile() {
    this.filesystem.writeFile(
      this.loggerFile,
      `\n\n\n===== Starting up ${this.loggerName} =====`,
      { flag: 'a+' },
      (err) => {
        if (err) {
          console.error(err)
        }
      }
    )
  }

  info() {}
  log(content: string) {
    this.filesystem.appendFileSync(
      this.loggerFile,
      `\n${this.jobName} ${content}`
    )
    console.log(`${this.jobName} ${content}`)
  }
}
