# Code Sandbox

Test project for messing around with remote code execution sandboxes (eg. go playground, hackerrack, etc)

## Getting Started

```
yarn
docker build goenv -t codesandbox-goenv
yarn dev
```

## TODO

-   error handling for executed code
-   execution timeout
-   containerize the service/app
-   add multi-language support
-   add security to sandbox environment
    -   [Kata Containers](https://github.com/kata-containers)
    -   [Google gVisor](https://github.com/google/gvisor)
-   improve front-end
    -   convert to React app
    -   better styling
-   using websockets to do client/server comms
-   add message queue to handle high request load
