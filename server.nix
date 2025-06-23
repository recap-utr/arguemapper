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

      # CORS proxy for aifdb.org
      handle /api/aifdb/* {
        reverse_proxy https://aifdb.org {
          header_up Host aifdb.org
          header_up -X-Forwarded-For
          header_up -X-Forwarded-Proto
          header_down +Access-Control-Allow-Origin "*"
          header_down +Access-Control-Allow-Methods "GET, POST, OPTIONS"
          header_down +Access-Control-Allow-Headers "Content-Type"
        }
        uri strip_prefix /api/aifdb
      }

      # Serve static files with SPA fallback
      handle {
        try_files {path} /index.html
        file_server
      }
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
