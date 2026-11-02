# https://github.com/caddyserver/caddy-docker/blob/master/Dockerfile.tmpl
{
  dockerTools,
  mailcap,
  lib,
  server,
}:
dockerTools.streamLayeredImage {
  name = "arguemapper";
  contents = [
    dockerTools.caCertificates
    dockerTools.fakeNss
    mailcap
  ];
  extraCommands = ''
    mkdir -m 1777 tmp config data
  '';
  config = {
    Entrypoint = [ (lib.getExe server) ];
    ExposedPorts."${toString server.port}/tcp" = { };
    User = "nobody:nobody";
    # https://caddyserver.com/docs/conventions#file-locations
    Env = [
      "HOME=/tmp"
      "XDG_CONFIG_HOME=/config"
      "XDG_DATA_HOME=/data"
    ];
    WorkingDir = "/srv";
  };
}
