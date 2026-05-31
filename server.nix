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
      encode zstd gzip

      header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        Content-Security-Policy "frame-ancestors 'none'"
        -Server
      }

      # CORS proxy for aifdb.org
      handle_path /api/aifdb/* {
        reverse_proxy https://aifdb.org {
          header_up Host aifdb.org
          header_up -X-Forwarded-For
          header_up -X-Forwarded-Proto
          header_down +Access-Control-Allow-Origin "*"
          header_down +Access-Control-Allow-Methods "GET, POST, OPTIONS"
          header_down +Access-Control-Allow-Headers "Content-Type"
        }
      }

      # CORS proxy for Wikimedia Core REST API
      handle_path /api/wikipedia/* {
        reverse_proxy https://api.wikimedia.org {
          header_up Host api.wikimedia.org
          header_up -X-Forwarded-For
          header_up -X-Forwarded-Proto
          header_down +Access-Control-Allow-Origin "*"
          header_down +Access-Control-Allow-Methods "GET, OPTIONS"
          header_down +Access-Control-Allow-Headers "Content-Type"
        }
      }

      # Serve static files with SPA fallback
      handle {
        @immutable path /assets/*
        header @immutable Cache-Control "public, max-age=31536000, immutable"

        @html not path /assets/*
        header @html Cache-Control "no-store"

        header {
          -ETag
          -Last-Modified
        }

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
