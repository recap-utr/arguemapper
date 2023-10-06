# ArgueMapper

The ArgueMapper tool can be used to convert arguments in plain texts (e.g., newspaper articles) to structured argument graphs.
Existing tools to create argument graphs are tailored for experts in the domain of argumentation.
ArgueMapper is the first of its kind to be optimized for mobile devices and provide a discoverable interface suitable for novice users.
You can try it out immediately by visiting our [hosted version](https://arguemapper.uni-trier.de).
There are no server-side components in this app, so your data never leaves your device.

## Docker Image

```shell
# Building
nix build .#docker -o arguemapper.tar.gz --system x86_64-linux
# Loading
docker load -i arguemapper.tar.gz
# Running
docker run -p 8080:8080 arguemapper
```
