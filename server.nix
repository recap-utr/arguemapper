{
  writeShellApplication,
  runCommand,
  arguemapper,
  lib,
  caddy,
  port ? 8080,
}:
let
  # Adapting at build time validates the Caddyfile and avoids parsing it on every start.
  config =
    runCommand "arguemapper-caddy.json"
      {
        nativeBuildInputs = [ caddy ];
        ARGUEMAPPER_ROOT = arguemapper;
        ARGUEMAPPER_PORT = port;
      }
      ''
        HOME="$TMPDIR" caddy adapt --config ${./Caddyfile} --validate > "$out"
      '';
in
writeShellApplication {
  name = "arguemapper-server";
  text = ''
    exec ${lib.getExe caddy} run --config ${config}
  '';
  derivationArgs.passthru = { inherit port config; };
  meta = arguemapper.meta // {
    inherit (caddy.meta) platforms;
  };
}
