import styles from './ResultPanel.module.scss'
import { type SimulatedResponse } from './simulateRequest'

interface Props {
  readonly response: SimulatedResponse | undefined
}

/** Shows what the service would answer to the last line: the body verbatim and the status code. */
export function ResultPanel({ response }: Readonly<Props>) {
  return (
    <section className={styles.panel}>
      <h2>Result</h2>
      <pre
        className={styles.body}
        role='status'
        aria-label='Result'
      >
        {response?.body ?? ''}
      </pre>
      <p className={styles.code}>
        Status code{' '}
        <output aria-label='Status code'>{response === undefined ? '' : response.status}</output>
      </p>
    </section>
  )
}
