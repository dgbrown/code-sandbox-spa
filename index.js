// todo: you need to get the go code into the container at runtime
// currently its looking for stdin but any solution will do :)

import express from "express";
import Docker from "dockerode";

const PORT = 3000;

let app = express();

app.get("/");

const helloworlddotgo = `
package main

import "fmt"

func main() {
	fmt.Println("henlo world from the server")
}
`;

const streamToStringPromise = (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

app.listen(PORT, () => {
  console.log("Code Sandbox is running 🚀");
  let docker = new Docker();
  docker.createContainer(
    {
      Image: "codesandbox-goenv",
      OpenStdin: true,
    },
    (error, container) => {
      container.start(function (err) {
        container.exec(
          {
            Cmd: ["/usr/src/app/entrypoint.sh"],
            AttachStdin: true,
            AttachStdout: true,
          },
          function (err, exec) {
            exec.start({ hijack: true, stdin: true }, function (err, stream) {
              stream.write(helloworlddotgo);
              stream.end();

              streamToStringPromise(stream).then((data) => {
                console.log(data.trimEnd());
              });
            });
          }
        );
      });
    }
  );
});
