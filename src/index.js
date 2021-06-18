import * as dotenv from 'dotenv'
import main_log from 'simple-node-logger'
import * as path from 'path'
import Bree from 'bree'
dotenv.config()

console.log('starting index.js')
const bree = new Bree({
  logger: console,
  jobs: [
    // runs `./jobs/importHighlightsToNotion.js` on start and then every 1 minutes
    {
      name: 'importHighlightsToNotion',
      interval: '1m',
    },
  ],
})

console.log('starting bree')
bree.start()
