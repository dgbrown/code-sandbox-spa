// todo: you need to get the go code into the container at runtime
// currently its looking for stdin but any solution will do :)

import express from 'express'
import bodyParser from 'body-parser'
import Docker from 'dockerode'

const helloworlddotgo = `
package main

import "fmt"

func main() {
	fmt.Println("henlo world from the server")
}
`

const PORT = 3000

let app = express()

let docker = new Docker()

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

                                    streamToStringPromise(stream).then(
                                        (data) => {
                                            const result = data.trimEnd()
                                            console.log(result)
                                            resolve(result)
                                        }
                                    )
                                }
                            )
                        }
                    )
                })
            }
        )
    })
}

app.use(bodyParser.urlencoded())

app.post('/exec', (req, res) => {
    if (req.body.codez) {
        execCode(req.body.codez).then((result) => {
            res.status(200).send(result)
        })
    } else {
        res.status(400).send('Missing the codez')
    }
})

app.use(express.static('static'))

const streamToStringPromise = (stream) => {
    const chunks = []
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
        stream.on('error', (err) => reject(err))
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
}

app.listen(PORT, () => {
    console.log('Code Sandbox is running 🚀')
})
