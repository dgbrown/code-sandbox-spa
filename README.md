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
    -   get it running in kubernetes first
-   improve front-end
    -   convert to React app
    -   better styling
-   add message queue to handle high request load
    -   switch to using websockets to do client/server comms first
-   write tests

## Learnings

### Securing the Sandbox

Containers are inherently insecure because it's possible to make system calls to the host kernel and even escape the container itself.

Two prominent solutions exist that are OCI-compliant and work out of the box with Docker/Kubernetes:

1. [Google gVisor](https://github.com/google/gvisor)
    - solves the security issues of containers by running in a sandbox
    - implements its own system calls to protect and filter calls to the host kernel
2. [Kata Containers](https://github.com/kata-containers)
    - solves the speed issues of virtual machines while maintaining their security levels
    - runs a virtualization layer that provides isolation but works more like containers

Both of these solutions are built for Linux only, cannot be run on a Windows or OSX host. So these runtimes can and should only be utilized in a production environment.
