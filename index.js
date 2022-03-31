import express from 'express'
import bodyParser from 'body-parser'
import Docker from 'dockerode'
import { PassThrough } from 'stream'
import amqp from 'amqplib'

const PORT = process.env.PORT || 4000
const NODE_ENV = process.env.NODE_ENV

let app = express()
let docker = new Docker()

const MQ_RETRY_INTERVAL = 1000
const queue = 'code-execution'
let channel
if (NODE_ENV === 'production') {
    if (!channel) {
        connectMQ()
    }
}

function connectMQ(wait = 0) {
    setTimeout(() => {
        amqp.connect('amqp://mq')
            .then((connection) => {
                console.log('Successfully connected to Rabbit MQ!')
                connection
                    .createChannel()
                    .then((chan) => {
                        chan.assertQueue(queue, { durable: false })
                        channel = chan
                    })
                    .catch((err) => {
                        console.error('Failed to create channel', err)
                    })
            })
            .catch((err) => {
                console.warn(
                    'Failed to connect to Rabbit MQ, retrying in ',
                    MQ_RETRY_INTERVAL
                )
                connectMQ(MQ_RETRY_INTERVAL)
            })
    }, wait)
}

async function streamToString(stream) {
    // lets have a ReadableStream as a stream variable
    const chunks = []

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
    }

    return Buffer.concat(chunks).toString('utf-8')
}

const removeTerminalGarbage = (string) => {
    return string.trim().replace(/[\0\f\01]/g, '')
}

const transformGoOutputForResponse = (stdout, stderr) => {
    stdout = removeTerminalGarbage(stdout)
    stderr = removeTerminalGarbage(stderr)

    let errorType = null

    const BUILD_ERR_PREFIX_HINT = '# improbable.io/hydra/codesandbox\n'
    if (stderr.startsWith(BUILD_ERR_PREFIX_HINT)) {
        stderr = stderr.replace(BUILD_ERR_PREFIX_HINT, '')
        errorType = 'BUILD'
    } else {
        errorType = 'RUNTIME'
    }

    console.debug(`outstring: ${stdout}`)
    console.debug(`errstring: ${stderr}`)

    return {
        output: stdout,
        error:
            stderr.length > 0
                ? {
                      message: stderr,
                      type: errorType,
                  }
                : null,
    }
}

function pushCodeToMQ(code) {
    return new Promise((resolve, reject) => {
        const payload = {
            code,
        }
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)))
        console.log('Sent code to queue', code)

        // TODO make this properly asynchronous
        setTimeout(() => {
            channel.consume(
                queue,
                (msg) => {
                    let payload
                    try {
                        payload = JSON.parse(msg.content.toString())
                    } catch (err) {
                        console.error('Failed to parse Rabbit Message', err)
                        reject()
                    }
                    if (payload) {
                        console.log('Received message from queue', payload)
                        return execGoCode(payload.code).then(resolve)
                    }
                },
                { noAck: true }
            )
        }, 1000)
    })
}

function execGoCode(code) {
    return new Promise((resolve, reject) => {
        docker.createContainer(
            {
                Image: 'codesandbox-goenv',
                OpenStdin: true,
            },
            (err, container) => {
                if (err) {
                    reject(err)
                }
                container.start(function (err) {
                    if (err) {
                        reject(err)
                    }
                    container.exec(
                        {
                            Cmd: ['/usr/src/app/entrypoint.sh'],
                            AttachStdin: true,
                            AttachStdout: true,
                            AttachStderr: true,
                        },
                        function (err, exec) {
                            if (err) {
                                reject(err)
                            }
                            exec.start(
                                { hijack: true, stdin: true },
                                function (err, stream) {
                                    stream.write(code)
                                    stream.end()

                                    const stdoutPassthrough = new PassThrough()
                                    const stderrPassthrough = new PassThrough()

                                    docker.modem.demuxStream(
                                        stream,
                                        stdoutPassthrough,
                                        stderrPassthrough
                                    )

                                    stream.on('end', function () {
                                        stdoutPassthrough.end()
                                        stderrPassthrough.end()
                                    })

                                    Promise.all([
                                        streamToString(stdoutPassthrough),
                                        streamToString(stderrPassthrough),
                                    ]).then(([stdoutString, stderrString]) => {
                                        resolve(
                                            transformGoOutputForResponse(
                                                stdoutString,
                                                stderrString
                                            )
                                        )
                                    })
                                }
                            )
                        }
                    )
                })
            }
        )
    })
}

app.use(bodyParser.json())

app.use(express.static('ui/build'))

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'ui/build/index.html'))
})

app.post('/exec', (req, res) => {
    if (req.body.codez) {
        const doTheThing =
            NODE_ENV === 'production'
                ? pushCodeToMQ(req.body.codez)
                : execGoCode(req.body.codez)
        doTheThing.then((result) => {
            res.status(200).send(JSON.stringify({ result }))
        })
    } else {
        res.status(400).send('Missing the codez')
    }
})

app.listen(PORT, () => {
    console.log('Code Sandbox is running 🚀')
})
