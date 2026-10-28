import { CONFIG } from '../config/env'

/** A unit of work handed to a worker. */
export interface Job {
  id: string
  run?: () => Promise<void>
}

/** Starts the workers over the job list and returns how many were started. */
export async function start(jobs: Job[]): Promise<number> {
  const workers: Promise<void>[] = []
  for (let i = 0; i < CONFIG.numWorkers; i += 1) {
    workers.push(worker(jobs))
  }
  await Promise.all(workers)
  return CONFIG.numWorkers
}

async function worker(queue: Job[]): Promise<void> {
  for (let job = queue.shift(); job !== undefined; job = queue.shift()) {
    if (job.run !== undefined) {
      await job.run()
    }
    console.info(`pool: job ${job.id} done`)
  }
}
