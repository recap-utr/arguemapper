{
  writeShellApplication,
  writeText,
  arguemapper,
  lib,
  caddy,
  caddyPort ? 8080,
}:
let
  caddyfile = writeText "caddyfile" ''
    {
      admin off
      auto_https off
      persist_config off
    }

    :${toString caddyPort} {
      root * ${arguemapper}
      encode gzip
      try_files {path} /index.html
      file_server
    }
  '';
in
writeShellApplication {
  name = "arguemapper-server";
  text = ''
    ${lib.getExe caddy} run --config ${caddyfile} --adapter caddyfile
  '';
  derivationArgs = {
    passthru.port = caddyPort;
  };
  meta = arguemapper.meta // {
    inherit (caddy.meta) platforms;
  };
}
