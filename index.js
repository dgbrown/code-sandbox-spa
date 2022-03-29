// todo: you need to get the go code into the container at runtime
// currently its looking for stdin but any solution will do :)

import express from 'express'
import bodyParser from 'body-parser'
import Docker from 'dockerode'

const PORT = 3000

let app = express()

let docker = new Docker()

async function streamToString(stream) {
    // lets have a ReadableStream as a stream variable
    const chunks = []

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk))
    }

    return Buffer.concat(chunks).toString('utf-8')
}

function execCode(code) {
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

                                    streamToString(stream).then((data) => {
                                        const result = data
                                            .trim()
                                            .replace(/[\0\f\01]/g, '') // clean up null byte characters and other oddities from the buffer output
                                        console.log(result)
                                        resolve(result)
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

app.post('/exec', (req, res) => {
    if (req.body.codez) {
        execCode(req.body.codez).then((result) => {
            res.status(200).send(JSON.stringify({ result }))
        })
    } else {
        res.status(400).send('Missing the codez')
    }
})

app.use(express.static('static'))

app.listen(PORT, () => {
    console.log('Code Sandbox is running 🚀')
})
