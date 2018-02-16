import * as fs from 'fs'
import * as NodeWebSocket from 'ws'
import * as HttpsProxyAgent from 'https-proxy-agent'
import { ThingMessage, ThingMessageInfo } from '../util/thing-message'
import { util } from '../util/util'
import { setInterval } from 'timers'

const CONFIG = JSON.parse(fs.readFileSync('config.json', 'utf8'))

const WEBSOCKET_OPTIONS = {
  agent: process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy || process.env.HTTPS_PROXY) : null,
  headers: {
    ...CONFIG.websocketHeaders,
    'Authorization': 'Basic ' + new Buffer(CONFIG.deviceSimulation.username + ':' + CONFIG.deviceSimulation.password).toString('base64')
  }
}
const WEBSOCKET_REOPEN_TIMEOUT = 1000

const THING_ID = CONFIG.deviceSimulation.thingId
const THING_ID_PATH = THING_ID.replace(':', '/')

export class DeviceSimulation {

  private ws?: NodeWebSocket

  private status: {
    temperature?: number
  } = {}

  private config: {
    threshold?: number
  } = {}

  // constructor() {
  // }

  start() {
    console.log('[DeviceSimulation] start')

    util.openWebSocket(CONFIG.websocketBaseUrl + '/ws/2', WEBSOCKET_OPTIONS, WEBSOCKET_REOPEN_TIMEOUT,
      (ws) => {
        this.ws = ws

        this.ws.on('message', (data) => {
          const dataString = data.toString()
          if (dataString.startsWith('{')) {
            this.process(new ThingMessage(JSON.parse(dataString) as ThingMessageInfo))
          } else if (dataString.startsWith('START-SEND-') && dataString.endsWith(':ACK')) {
              // ignore START-SEND-*:ACK
          } else {
            console.log('[DeviceSimulation] unprocessed non-json data: ' + data)
          }
        })

        this.ws.send('START-SEND-EVENTS', (err) => { if (err) console.log(`[DeviceSimulation] websocket send error ${err}`) })
        this.ws.send('START-SEND-MESSAGES', (err) => { if (err) console.log(`[DeviceSimulation] websocket send error ${err}`) })
        this.ws.send('START-SEND-LIVE-COMMANDS', (err) => { if (err) console.log(`[DeviceSimulation] websocket send error ${err}`) })
        this.ws.send('START-SEND-LIVE-EVENTS', (err) => { if (err) console.log(`[DeviceSimulation] websocket send error ${err}`) })

        setInterval(() => this.updateStatus(), 4000)
      })
  }

  private process(m: ThingMessage) {

    if (m.channel === 'twin' && m.criterion === 'events' && m.action === 'modified'
      && m.path.startsWith('/features/Device/properties/config')) {

      if (THING_ID === m.thingId) {
        const t = util.partial(m.path, m.value)
        if (t.features.Device.properties.config.threshold) {
          this.config.threshold = t.features.Device.properties.config.threshold
          console.log('[DeviceSimulation] new threshold: ' + this.config.threshold)
          return
        }
      }
    }

    console.log('[DeviceSimulation] unprocessed data: ' + m.topic + ' ' + m.thingId + ' ' + m.path + ' ' + m.status + ' ' + JSON.stringify(m.value))
  }

  private updateStatus() {
    this.status.temperature = 18 + Math.random() * 10

    if (!this.config.threshold || this.status.temperature > this.config.threshold) {
      console.log(`[DeviceSimulation] send relevant temperature update: ${this.status.temperature}`)

      const update: ThingMessage = new ThingMessage({
        topic: THING_ID_PATH + '/things/twin/commands/modify',
        path: '/features/Device/properties/status',
        value: this.status,
        headers: { 'response-required': false /*, 'correlation-id': '123'*/ }
      })

      this.ws!.send(JSON.stringify(update), (err) => { if (err) console.log('[DeviceSimulation] updateStatus websocket send error ' + err) })
    }
  }

}