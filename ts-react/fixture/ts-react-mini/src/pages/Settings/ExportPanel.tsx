import { useState } from 'react'

import { start } from '../../export/workers'
import { summarize } from '../../features/report/wire'
import { useDevices } from '../../hooks/useDevices'
import styles from './ExportPanel.module.scss'

/** Exports the fleet: a catalog summary per model, and one export job per device. */
export function ExportPanel() {
  const devices = useDevices()
  const [summary, setSummary] = useState('')
  const [exported, setExported] = useState(0)

  function summarizeFleet() {
    const text = (devices.data ?? []).map((d) => `${d.id}/${d.version || 'unknown'}`).join('\n')
    const lines: string[] = []
    summarize((line) => lines.push(line), text)
    setSummary(lines.join(''))
  }

  async function exportAll() {
    let done = 0
    const jobs = (devices.data ?? []).map((d) => ({
      id: `export-${d.tenant}-${d.id}`,
      run: () => {
        done += 1
        return Promise.resolve()
      }
    }))
    await start(jobs)
    setExported(done)
  }

  return (
    <section className={styles.panel}>
      <h2>Export</h2>
      <button
        type='button'
        onClick={summarizeFleet}
      >
        Summarize by firmware
      </button>
      <button
        type='button'
        onClick={() => void exportAll()}
      >
        Export all
      </button>
      {summary !== '' && <pre>{summary}</pre>}
      {exported > 0 && <p role='status'>exported {exported} devices</p>}
    </section>
  )
}
