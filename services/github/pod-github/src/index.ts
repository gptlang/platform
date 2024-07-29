//
// Copyright © 2023 Hardcore Engineering Inc.
//

import { MeasureMetricsContext, metricsToString, newMetrics } from '@hcengineering/core'
import { SplitLogger, configureAnalytics } from '@hcengineering/analytics-service'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import config from './config'
import { start } from './server'
import { Analytics } from '@hcengineering/analytics'
import { loadBrandingMap } from '@hcengineering/server-core'

// Load and inc startID, to have easy logs.

const metricsContext = new MeasureMetricsContext(
  'github',
  {},
  {},
  newMetrics(),
  new SplitLogger('github-service', {
    root: join(process.cwd(), 'logs'),
    enableConsole: (process.env.ENABLE_CONSOLE ?? 'true') === 'true'
  })
)

configureAnalytics(config.SentryDSN, config)
Analytics.setTag('application', 'github-service')

let oldMetricsValue = ''

const intTimer = setInterval(() => {
  const val = metricsToString(metricsContext.metrics, 'Github', 140)
  if (val !== oldMetricsValue) {
    oldMetricsValue = val
    void writeFile('metrics.txt', val).catch((err) => {
      console.error(err)
    })
  }
}, 30000)

void start(metricsContext, loadBrandingMap(config.BrandingPath))

const onClose = (): void => {
  clearInterval(intTimer)
  metricsContext.info('Closed')
}

process.on('uncaughtException', (e) => {
  metricsContext.error('UncaughtException', { error: e })
})

process.on('unhandledRejection', (reason, promise) => {
  metricsContext.error('Unhandled Rejection at:', { promise, reason })
})

process.on('SIGINT', onClose)
process.on('SIGTERM', onClose)
process.on('exit', onClose)