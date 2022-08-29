# ArgueMapper

The ArgueMapper tool can be used to convert arguments in plain texts (e.g., newspaper articles) to structured argument graphs.
Existing tools to create argument graphs are tailored for experts in the domain of argumentation.
ArgueMapper is the first of its kind to be optimized for mobile devices and provide a discoverable interface suitable for novice users.
You can try it out immediately by visiting our [hosted version](https://arguemapper.uni-trier.de).
There are no server-side components in this app, so your data never leaves your device.

If you still do not trust our server, you are free to use our provided docker configuration.
Just pull this repository and run `docker-compose up` and the app will be available at `127.0.0.1:80`.
If you do not want to build the image yourself (a number of dependencies need to be downloaded for that), you can also pull and run our [custom image](ghcr.io/recap-utr/arguemapper) built with GitHub actions.
