import dotenv from 'dotenv'
import path from 'path'

// This file is used to replace `server.ts` when ejecting i.e. `yarn eject`
// See `../eject.ts` for exact details on how this file is used
// See `./README.md#eject` for more information

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
})

import express from 'express'
import payload from 'payload'

import { ensureDemoDatabase, seedDemoDatabaseIfEmpty } from './payload/utilities/ensureDemoDatabase'
import { seed } from './payload/seed'

const app = express()
const PORT = process.env.PORT || 3000

// Redirect root to the admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

const start = async (): Promise<void> => {
  const usingDemoDatabase = await ensureDemoDatabase()

  await payload.init({
    secret: process.env.PAYLOAD_SECRET || '',
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
  })

  if (process.env.PAYLOAD_SEED === 'true') {
    await seed(payload)
    process.exit()
  }

  if (usingDemoDatabase) {
    await seedDemoDatabaseIfEmpty(payload)
  }

  app.listen(PORT, async () => {
    payload.logger.info(`App URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL}`)
  })
}

start()
