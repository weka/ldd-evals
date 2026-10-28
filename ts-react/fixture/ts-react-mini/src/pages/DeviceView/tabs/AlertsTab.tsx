import { useEffect, useState } from 'react'

import { RequireWrite } from '../../../components/RequireWrite/RequireWrite'
import { useServices } from '../../../context/ServicesContext'
import { fetchAlerts, type RaisedAlert } from '../../../services/alertsApi'
import { AlertService } from '../../../services/alertService'
import { apiClient } from '../../../services/apiClient'
import { type Device } from '../../../types/device'
import { formatStamp } from '../../../utils/time'
import { AuditLog } from '../../Heartbeats/heartbeatFeed'
import styles from './AlertsTab.module.scss'

interface Props {
  readonly device: Device
}

/** The alerts that mention this device, and a button to raise the one its status earns again. */
export function AlertsTab({ device }: Readonly<Props>) {
  const { notifier, audit } = useServices()
  const [alerts, setAlerts] = useState<readonly RaisedAlert[]>([])
  const [failed, setFailed] = useState(false)
  const [raised, setRaised] = useState('')

  useEffect(() => {
    fetchAlerts(apiClient)
      // eslint-disable-next-line promise/prefer-await-to-then -- TODO
      .then((all) => {
        setAlerts(all.filter((a) => a.message.includes(device.id)))
        return undefined
      })
      // eslint-disable-next-line promise/prefer-await-to-then -- TODO
      .catch(() => {
        setFailed(true)
      })
  }, [device.id])

  async function reRaise() {
    const svc = new AlertService(notifier, new AuditLog(audit), 'json')
    try {
      await svc.raiseAlert(device)
      setRaised(svc.raisedCount() > 0 ? 'raised' : 'nothing to raise')
    } catch (err) {
      setRaised(String(err))
    }
  }

  return (
    <section>
      <h2>Alerts</h2>
      {failed ? <p role='alert'>alerts unavailable</p> : null}
      <ul className={styles.list}>
        {alerts.map((a) => (
          <li key={`${a.channel}-${a.sentAt.getTime()}`}>
            {formatStamp(a.sentAt)} {a.channel}: {a.message}
          </li>
        ))}
      </ul>
      <RequireWrite>
        <button
          type='button'
          onClick={() => void reRaise()}
        >
          Raise again
        </button>
      </RequireWrite>
      {raised !== '' && <p role='status'>{raised}</p>}
    </section>
  )
}
