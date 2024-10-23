{
  dockerTools,
  cacert,
  tzdata,
  lib,
  arguemapper-server,
}:
dockerTools.streamLayeredImage {
  name = "arguemapper";
  tag = "latest";
  created = "now";
  contents = [
    cacert
    tzdata
    dockerTools.fakeNss
  ];
  extraCommands = ''
    mkdir -m 1777 tmp
  '';
  config = {
    Entrypoint = [ (lib.getExe arguemapper-server) ];
    ExposedPorts = {
      "${toString arguemapper-server.passthru.port}/tcp" = { };
    };
    User = "nobody:nobody";
  };
}
