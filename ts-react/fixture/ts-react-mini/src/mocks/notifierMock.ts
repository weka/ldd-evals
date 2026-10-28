/** Notifier interface; avoids an import cycle with the alerts package. */
export interface NotifierAPI {
  /** Sends a message on a channel. */
  send(channel: string, msg: string): Promise<void>
}

/** Records every message sent through it. */
export class NotifierMock implements NotifierAPI {
  readonly sent: string[] = []

  /** Records the message. */
  send(channel: string, msg: string): Promise<void> {
    this.sent.push(channel + ': ' + msg)
    return Promise.resolve()
  }
}
