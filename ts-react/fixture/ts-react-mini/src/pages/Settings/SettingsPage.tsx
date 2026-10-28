import { ChannelsForm } from './ChannelsForm'
import { EndpointForm } from './EndpointForm'
import { ExportPanel } from './ExportPanel'
import { RetentionForm } from './RetentionForm'
import styles from './SettingsPage.module.scss'

/** Retention, channels, the sibling endpoint and the export tools. */
export function SettingsPage() {
  return (
    <main className={styles.page}>
      <h1>Settings</h1>
      <RetentionForm />
      <ChannelsForm />
      <EndpointForm />
      <ExportPanel />
    </main>
  )
}
