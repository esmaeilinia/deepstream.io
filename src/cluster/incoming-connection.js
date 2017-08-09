const ClusterConnection = require('./cluster-connection')
const MESSAGE = require('./message-enums')

class IncomingConnection extends ClusterConnection {
  constructor (socket, config) {
    super(config)

    this._socket = socket
    this._configureSocket()
    this.on('known', this._onKnown.bind(this))
    this._pingTimeoutId = null
    this._onPingTimeoutBound = this._onPingTimeout.bind(this)
  }

  _onConnect () {
    this._pingTimeoutId = setTimeout(this._onPingTimeoutBound, this._config.pingTimeout)
    this.emit('connect')
  }

  _onKnown () {
    if (this._state === this.STATE.IDENTIFIED) {
      this._stateTransition(this.STATE.STABLE)
    }
  }

  _handlePing () {
    clearTimeout(this._pingTimeoutId)
    if (this.isAlive()) {
      this._send(MESSAGE.PONG)
      this._pingTimeoutId = setTimeout(
        this._onPingTimeoutBound,
        this._config.pingInterval + this._config.pingTimeout
      )
    }
  }

  _onPingTimeout () {
    if (this.isAlive()) {
      this.emit('error', `connection did not receive a PING in ${
        this._config.pingInterval + this._config.pingTimeout
      }ms`)
    }
  }

  _onSocketError (error) {
    this.emit('error', error)
  }

  close () {
    clearTimeout(this._pingTimeoutId)
    super.close()
  }
}

module.exports = IncomingConnection
