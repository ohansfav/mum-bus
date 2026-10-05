import net from 'net'

import type { Payload } from 'payload'
import { MongoMemoryServer } from 'mongodb-memory-server'

import { seed } from '../seed'

let memoryServer: MongoMemoryServer | undefined

const LOCAL_MONGO_HOSTS = new Set(['127.0.0.1', 'localhost'])

const isLocalMongoURI = (databaseURI?: string): boolean => {
  if (!databaseURI) return true

  const match = databaseURI.match(/^mongodb(?:\+srv)?:\/\/([^/?]+)/i)
  const authority = match?.[1]

  if (!authority) return false

  const hostSegment = authority.includes('@') ? authority.split('@').pop() : authority
  const firstHost = hostSegment?.split(',')[0]?.trim()
  const host = firstHost?.split(':')[0]?.trim().toLowerCase()

  return Boolean(host && LOCAL_MONGO_HOSTS.has(host))
}

const canReachMongo = async (databaseURI?: string): Promise<boolean> => {
  if (!databaseURI || !isLocalMongoURI(databaseURI)) return false

  const match = databaseURI.match(/^mongodb(?:\+srv)?:\/\/([^/?]+)/i)
  const authority = match?.[1]
  const hostSegment = authority?.includes('@') ? authority.split('@').pop() : authority
  const firstHost = hostSegment?.split(',')[0]?.trim()
  const [rawHost, rawPort] = firstHost?.split(':') ?? []
  const host = rawHost || '127.0.0.1'
  const port = Number(rawPort || '27017')

  return new Promise(resolve => {
    const socket = net.createConnection({ host, port })

    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })

    socket.once('error', () => resolve(false))
    socket.setTimeout(1000, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

export const ensureDemoDatabase = async (): Promise<boolean> => {
  const databaseURI = process.env.DATABASE_URI

  if (await canReachMongo(databaseURI)) {
    return false
  }

  if (!isLocalMongoURI(databaseURI)) {
    return false
  }

  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create({
      binary: {
        version: '6.0.14',
      },
      instance: {
        dbName: 'payload-ecommerce',
      },
    })

    process.env.DATABASE_URI = memoryServer.getUri('payload-ecommerce')

    const stopMemoryServer = async (): Promise<void> => {
      if (!memoryServer) return

      await memoryServer.stop()
      memoryServer = undefined
    }

    process.once('SIGINT', () => {
      void stopMemoryServer().finally(() => process.exit(0))
    })

    process.once('SIGTERM', () => {
      void stopMemoryServer().finally(() => process.exit(0))
    })
  }

  return true
}

export const seedDemoDatabaseIfEmpty = async (payload: Payload): Promise<void> => {
  const existingPages = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    where: {},
  })

  if (existingPages.totalDocs > 0) {
    return
  }

  await seed(payload)
}