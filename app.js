var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var client = require('prom-client')  // ← NUEVO

var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')
var itemsRouter = require('./routes/items')

var app = express()

// ── PROMETHEUS ────────────────────────────────────────────
// 1. Métricas por defecto de Node.js (RAM, CPU del proceso)
client.collectDefaultMetrics()

// 2. Contador de peticiones HTTP
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP procesadas',
  labelNames: ['metodo', 'ruta', 'estado_http'],
})

// 3. Gauge de usuarios activos simulados
const activeUsersGauge = new client.Gauge({
  name: 'active_users_current',
  help: 'Número actual de usuarios activos simulados'
})

// 4. Middleware que cuenta cada petición automáticamente
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({
      metodo: req.method,
      ruta: req.path,
      estado_http: String(res.statusCode),
    })
  })
  next()
})

// 5. Simula usuarios activos (entre 1 y 50 cada 5 segundos)
setInterval(() => {
  activeUsersGauge.set(Math.floor(Math.random() * 50) + 1)
}, 5000)

// 6. Endpoint /metrics que Prometheus leerá
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.send(await client.register.metrics())
})
// ──────────────────────────────────────────────────────────

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/items', itemsRouter)

module.exports = app