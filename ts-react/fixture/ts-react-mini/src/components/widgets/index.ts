import { widgets } from '../../hooks/registry'
import { FleetWidget } from './FleetWidget'
import { UptimeWidget } from './UptimeWidget'

widgets.register('fleet', FleetWidget)
widgets.register('uptime', UptimeWidget)
